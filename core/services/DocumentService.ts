import { Document } from "../domain/Document";
import { CaterpillarsAdvice } from "../domain/CaterpillarsAdvice";

import { OcrPort } from "../ports/outbound/OcrPort";
import { TtsPort } from "../ports/outbound/TtsPort";
import { StoragePort } from "../ports/outbound/StoragePort";
import { ExplanationPort } from "../ports/outbound/ExplanationPort";

import { ReadDocumentUseCase, ReadDocumentRequest } from "../ports/inbound/ReadDocumentUseCase";
import { ExplainTextUseCase, ExplainTextRequest } from "../ports/inbound/ExplainTextUseCase";
import { GetDocumentUseCase } from "../ports/inbound/GetDocumentUseCase";

import {
  ValidationError,
  NotFoundError,
  ExternalApiError,
  StorageError,
  AppError,
} from "../errors/AppErrors";

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

export class DocumentService implements ReadDocumentUseCase, ExplainTextUseCase, GetDocumentUseCase {
  private readonly ocrPort: OcrPort;
  private readonly ttsPort: TtsPort;
  private readonly storagePort: StoragePort;
  private readonly explanationPort: ExplanationPort;

  constructor(
    ocrPort: OcrPort,
    ttsPort: TtsPort,
    storagePort: StoragePort,
    explanationPort: ExplanationPort
  ) {
    this.ocrPort = ocrPort;
    this.ttsPort = ttsPort;
    this.storagePort = storagePort;
    this.explanationPort = explanationPort;
  }

  public async execute(request: ReadDocumentRequest | ExplainTextRequest): Promise<Document> {
    if ("files" in request) {
      return this.executeReadDocument(request);
    } else {
      return this.executeExplanation(request);
    }
  }

  private async executeReadDocument(request: ReadDocumentRequest): Promise<Document> {
    if (!request.files || request.files.length === 0) {
      throw new Error("No textbook screenshots uploaded for processing.");
    }

    // Validate extensions server-side before any disk write
    for (const file of request.files) {
      const ext = (file.originalFilename.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new Error(`File type .${ext} is not permitted. Allowed: png, jpg, jpeg, gif, webp.`);
      }
    }

    const documentId = crypto.randomUUID();

    const filesToSave = request.files.map((file, idx) => {
      const extension = (file.originalFilename.split(".").pop() || "png").toLowerCase();
      return {
        buffer: file.fileBuffer,
        fileName: `${documentId}_page_${idx + 1}.${extension}`,
      };
    });

    const savedFilenames = filesToSave.map((f) => f.fileName);
    let savedFilePaths: string[];
    try {
      savedFilePaths = await this.storagePort.saveFiles(filesToSave);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new StorageError(`Failed to save uploaded files: ${(err as Error).message}`);
    }

    let extractedText: string;
    try {
      const buffersToOcr = request.files.map((file) => file.fileBuffer);
      extractedText = await this.ocrPort.extractText(buffersToOcr);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new ExternalApiError(`OCR service failed: ${(err as Error).message}`);
    }

    if (!extractedText || extractedText.trim() === "") {
      throw new ValidationError("Unable to extract any text from the provided textbook page screenshots.");
    }

    const firstFilename = request.files[0].originalFilename;
    const rawTitle = firstFilename
      .replace(/\.[^/.]+$/, "")
      .replace(/[/\\]/g, "")
      .replace(/_/g, " ");
    const docTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

    const document = new Document(
      documentId,
      docTitle,
      savedFilenames,
      savedFilePaths,
      new Date(),
      extractedText,
      undefined,
      undefined,
      request.userId
    );

    const audioFilename = `${documentId}.mp3`;
    try {
      await this.ttsPort.synthesizeSpeech(extractedText, audioFilename);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new ExternalApiError(`TTS service failed: ${(err as Error).message}`);
    }
    document.setAudioUrl(`/api/audio/${audioFilename}`);

    try {
      await this.storagePort.saveDocument(document);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new StorageError(`Failed to persist document: ${(err as Error).message}`);
    }
    return document;
  }

  public async executeExplanation(request: ExplainTextRequest): Promise<Document> {
    let document: Document | null;
    try {
      document = await this.storagePort.getDocumentById(request.documentId, request.userId);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new StorageError(`Failed to retrieve document: ${(err as Error).message}`);
    }

    if (!document) {
      throw new NotFoundError(`Document with ID ${request.documentId} does not exist in our library.`);
    }

    if (document.hasExplanation() && request.focusTimeMinutes === undefined) {
      return document;
    }

    const textToExplain = document.extractedText;
    if (!textToExplain || textToExplain.trim() === "") {
      throw new ValidationError("Cannot consult the Caterpillar on an empty document text.");
    }

    let caterpillarsAdvice;
    try {
      caterpillarsAdvice = await this.explanationPort.generateExplanation(
        textToExplain,
        request.focusTimeMinutes
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new ExternalApiError(`Explanation service failed: ${(err as Error).message}`);
    }

    document.setExplanation(caterpillarsAdvice);
    try {
      await this.storagePort.saveDocument(document);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new StorageError(`Failed to persist explanation: ${(err as Error).message}`);
    }
    return document;
  }

  public async getById(id: string, userId: string): Promise<Document | null> {
    return this.storagePort.getDocumentById(id, userId);
  }

  public async getAll(userId: string): Promise<Document[]> {
    return this.storagePort.getAllDocuments(userId);
  }

  public async delete(id: string, userId: string): Promise<void> {
    await this.storagePort.deleteDocument(id, userId);
  }
}
