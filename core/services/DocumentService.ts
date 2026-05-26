/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - represents the pure orchestration domain service boundary)
- Revision Action Taken: Wrapped port method executions in robust try/catch blocks translating framework exceptions into strongly typed AppErrors for cross-boundary delivery constraints.
---
*/

import { Document } from "../domain/Document";
import { CaterpillarsAdvice } from "../domain/CaterpillarsAdvice";

import { OcrPort } from "../ports/outbound/OcrPort";
import { TtsPort } from "../ports/outbound/TtsPort";
import { StoragePort } from "../ports/outbound/StoragePort";
import { ExplanationPort } from "../ports/outbound/ExplanationPort";

import { ReadDocumentUseCase, ReadDocumentRequest } from "../ports/inbound/ReadDocumentUseCase";
import { ExplainTextUseCase, ExplainTextRequest } from "../ports/inbound/ExplainTextUseCase";
import { GetDocumentUseCase } from "../ports/inbound/GetDocumentUseCase";

import { AppError, ValidationError, NotFoundError, ExternalApiError, RateLimitError, StorageError } from "../errors/AppErrors";

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

  /**
   * Universal execute method implementation that satisfies both ReadDocumentUseCase and ExplainTextUseCase.
   */
  public async execute(request: ReadDocumentRequest | ExplainTextRequest): Promise<Document> {
    if ("files" in request) {
      return this.executeReadDocument(request);
    } else {
      return this.executeExplanation(request);
    }
  }

  /**
   * Reads multiple uploaded screenshot files, extracts text via multi-image OCR, synthesizes TTS audio,
   * constructs the Document domain model with multiple filename segments, saves metadata, and returns the entity.
   */
  private async executeReadDocument(request: ReadDocumentRequest): Promise<Document> {
    if (!request.files || request.files.length === 0) {
        throw new ValidationError("No textbook screenshots uploaded for processing.");
    }

    const documentId = `doc_${crypto.randomUUID()}`;
    const allowedExtensions = ["png", "jpg", "jpeg", "gif", "webp"];
    
    // 1. Prepare file array for storage saving
    const filesToSave = request.files.map((file, idx) => {
      const extension = (file.originalFilename.split(".").pop() || "").toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        throw new ValidationError(`Invalid file extension '${extension}'. Allowed extensions are ${allowedExtensions.join(", ")}`);
      }
      const savedFilename = `${documentId}_page_${idx + 1}.${extension}`;
      return {
        buffer: file.fileBuffer,
        fileName: savedFilename
      };
    });

    const savedFilenames = filesToSave.map(file => file.fileName);

    // Save all binary file buffers via Storage Adapter
    let savedFilePaths: string[];
    try {
        savedFilePaths = await this.storagePort.saveFiles(filesToSave);
    } catch (e) {
        throw new StorageError(`Failed to save document images: ${(e as Error).message}`);
    }

    // 2. Extract academic text across all buffers sequentially utilizing Gemini multimodal vision prompt
    const buffersToOcr = request.files.map(file => file.fileBuffer);
    let extractedText: string;
    try {
        extractedText = await this.ocrPort.extractText(buffersToOcr);
    } catch (e) {
        throw new ExternalApiError(`The Caterpillar's hookah is out of smoke right now. The AI service failed: ${(e as Error).message}`);
    }

    if (!extractedText || extractedText.trim() === "") {
        throw new ValidationError("Unable to extract any text from the provided textbook page screenshots.");
    }

    // Determine readable document title based off of first page file name
    const firstFilename = request.files[0].originalFilename;
    const rawTitle = firstFilename.replace(/\.[^/.]+$/, "");
    const docTitle = (rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)).replace(/[^a-zA-Z0-9 -]/g, "");

    // 3. Create Document domain entity
    const document = new Document(
      documentId,
      docTitle || "Untitled Document",
      savedFilenames,
      savedFilePaths,
      new Date(),
      extractedText,
      undefined,
      undefined,
      request.userId
    );

    // 4. Synthesize native text-to-speech audio using Gemini voice generation adapter
    const audioFilename = `${documentId}.mp3`;
    try {
        await this.ttsPort.synthesizeSpeech(extractedText, audioFilename);
    } catch (e) {
        throw new ExternalApiError(`The Caterpillar's hookah is out of smoke right now. The AI service failed: ${(e as Error).message}`);
    }

    // Point the public API url to the route we will expose
    document.setAudioUrl(`/api/audio/${audioFilename}`);

    // 5. Persist document metadata using Storage Adapter
    try {
        await this.storagePort.saveDocument(request.userId, document);
    } catch (e) {
        throw new StorageError(`Failed to save document metadata: ${(e as Error).message}`);
    }

    return document;
  }

  /**
   * Invokes explanation generation representing the "Wise Caterpillar's Advice".
   * This handles translating academic texts with a glossary and caching existing advice.
   */
  public async executeExplanation(request: ExplainTextRequest): Promise<Document> {
    let document: Document | null;
    try {
        document = await this.storagePort.getDocumentById(request.userId, request.documentId);
    } catch (e) {
        throw new StorageError(`Failed to fetch document metadata: ${(e as Error).message}`);
    }

    if (!document) {
      throw new NotFoundError(`Document with ID ${request.documentId} does not exist in our library.`);
    }

    // Cache lookup: If explanation advice is already present AND no specific focusTimeMinutes requested, return it immediately
    if (document.hasExplanation() && request.focusTimeMinutes === undefined) {
      return document;
    }

    const textToExplain = document.extractedText;
    if (!textToExplain || textToExplain.trim() === "") {
        throw new ValidationError("Cannot consult the Caterpillar on an empty document text.");
    }

    // Query explanation adapter with optional focus pacing configuration parameter
    let caterpillarsAdvice: CaterpillarsAdvice;
    try {
        caterpillarsAdvice = await this.explanationPort.generateExplanation(
          textToExplain,
          request.focusTimeMinutes
        );
    } catch (e) {
        throw new ExternalApiError(`The Caterpillar's hookah is out of smoke right now. The AI service failed: ${(e as Error).message}`);
    }

    // Attach domain entity
    document.setExplanation(caterpillarsAdvice);

    // Cache/write changes to storage
    try {
        await this.storagePort.saveDocument(request.userId, document);
    } catch (e) {
        throw new StorageError(`Failed to save document metadata: ${(e as Error).message}`);
    }

    return document;
  }

  // Adapter method to implement the ExplainTextUseCase contract interface
  public async executeExplainText(request: ExplainTextRequest): Promise<Document> {
    return this.executeExplanation(request);
  }

  // Realize GetDocumentUseCase details
  public async getById(userId: string, id: string): Promise<Document | null> {
    try {
        return await this.storagePort.getDocumentById(userId, id);
    } catch (e) {
        throw new StorageError(`Failed to fetch document metadata: ${(e as Error).message}`);
    }
  }

  public async getAll(userId: string): Promise<Document[]> {
    try {
        return await this.storagePort.getAllDocuments(userId);
    } catch (e) {
        throw new StorageError(`Failed to fetch document metadata: ${(e as Error).message}`);
    }
  }

  public async delete(userId: string, id: string): Promise<void> {
    // Also delete metadata via the storage adaptation
    try {
        await this.storagePort.deleteDocument(userId, id);
    } catch (e) {
        throw new StorageError(`Failed to delete document metadata: ${(e as Error).message}`);
    }
  }
}
