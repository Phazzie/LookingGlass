/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - represents the pure orchestration domain service boundary)
- Revision Action Taken: Converted executeReadDocument to extract multiple files, save them collectively via storage saveFiles, invoke OCR in batch, and instantiate the updated multi-screenshot Document domain model.
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
      throw new Error("No textbook screenshots uploaded for processing.");
    }

    const documentId = `doc_${Date.now()}`;
    
    // 1. Prepare file array for storage saving
    const filesToSave = request.files.map((file, idx) => {
      const extension = file.originalFilename.split(".").pop() || "png";
      const savedFilename = `${documentId}_page_${idx + 1}.${extension}`;
      return {
        buffer: file.fileBuffer,
        fileName: savedFilename
      };
    });

    const savedFilenames = filesToSave.map(file => file.fileName);

    // Save all binary file buffers via Storage Adapter
    const savedFilePaths = await this.storagePort.saveFiles(filesToSave);

    // 2. Extract academic text across all buffers sequentially utilizing Gemini multimodal vision prompt
    const buffersToOcr = request.files.map(file => file.fileBuffer);
    const extractedText = await this.ocrPort.extractText(buffersToOcr);

    if (!extractedText || extractedText.trim() === "") {
      throw new Error("Unable to extract any text from the provided textbook page screenshots.");
    }

    const firstFilename = request.files[0].originalFilename;
    const rawTitle = firstFilename
      .replace(/\.[^/.]+$/, "")
      .replace(/[/\\]/g, "")
      .replace(/_/g, " ");
    const docTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

    // 3. Create Document domain entity
    const document = new Document(
      documentId,
      docTitle,
      savedFilenames,
      savedFilePaths,
      new Date(),
      extractedText
    );

    // 4. Synthesize native text-to-speech audio using Gemini voice generation adapter
    const audioFilename = `${documentId}.mp3`;
    await this.ttsPort.synthesizeSpeech(extractedText, audioFilename);

    // Point the public API url to the route we will expose
    document.setAudioUrl(`/api/audio/${audioFilename}`);

    // 5. Persist document metadata using Storage Adapter
    await this.storagePort.saveDocument(document);

    return document;
  }

  /**
   * Invokes explanation generation representing the "Wise Caterpillar's Advice".
   * This handles translating academic texts with a glossary and caching existing advice.
   */
  public async executeExplanation(request: ExplainTextRequest): Promise<Document> {
    const document = await this.storagePort.getDocumentById(request.documentId);
    if (!document) {
      throw new Error(`Document with ID ${request.documentId} does not exist in our library.`);
    }

    // Cache lookup: If explanation advice is already present AND no specific focusTimeMinutes requested, return it immediately
    if (document.hasExplanation() && request.focusTimeMinutes === undefined) {
      return document;
    }

    const textToExplain = document.extractedText;
    if (!textToExplain || textToExplain.trim() === "") {
      throw new Error("Cannot consult the Caterpillar on an empty document text.");
    }

    // Query explanation adapter with optional focus pacing configuration parameter
    const caterpillarsAdvice = await this.explanationPort.generateExplanation(
      textToExplain,
      request.focusTimeMinutes
    );

    // Attach domain entity
    document.setExplanation(caterpillarsAdvice);

    // Cache/write changes to storage
    await this.storagePort.saveDocument(document);

    return document;
  }

  // Realize GetDocumentUseCase details
  public async getById(id: string): Promise<Document | null> {
    return await this.storagePort.getDocumentById(id);
  }

  public async getAll(): Promise<Document[]> {
    return await this.storagePort.getAllDocuments();
  }

  public async delete(id: string): Promise<void> {
    // Also delete metadata via the storage adaptation
    await this.storagePort.deleteDocument(id);
  }
}
