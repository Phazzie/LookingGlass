/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (pure domain orchestration service, resolves inputs purely through ports)
- Revision Action Taken: Strictly followed correct path resolution, handled timestamp-based unique ID generation cleanly, and mapped the API-exposed path structure of the synthesized MP3 audio correctly.
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
    if ("fileBuffer" in request) {
      return this.executeReadDocument(request);
    } else {
      return this.executeExplainText(request);
    }
  }

  /**
   * Reads an uploaded screenshot file, extracts text via OCR, synthesizes TTS audio,
   * constructs the Document domain model, saves file/metadata, and returns the entity.
   */
  private async executeReadDocument(request: ReadDocumentRequest): Promise<Document> {
    const documentId = `doc_${Date.now()}`;
    
    // Determine extension or default to png
    const extension = request.originalFilename.split(".").pop() || "png";
    const savedFilename = `${documentId}_original.${extension}`;

    // 1. Save binary file buffer via Storage Adapter
    const savedFilePath = await this.storagePort.saveFile(request.fileBuffer, savedFilename);

    // 2. Extract academic text using visual Multimodal model
    const extractedText = await this.ocrPort.extractText(request.fileBuffer, request.mimeType);

    if (!extractedText || extractedText.trim() === "") {
      throw new Error("Unable to extract any text from the provided screenshot image.");
    }

    // Determine readable document title
    const rawTitle = request.originalFilename.replace(/\.[^/.]+$/, "");
    const docTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

    // 3. Create Document domain entity
    const document = new Document(
      documentId,
      docTitle,
      savedFilename,
      new Date(),
      extractedText
    );

    // 4. Synthesize native text-to-speech audio using Gemini voice generation adapter
    const audioFilename = `${documentId}.mp3`;
    const audioFilePath = await this.ttsPort.synthesizeSpeech(extractedText, audioFilename);

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

    // Cache lookup: If explanation advice is already present, return it immediately
    if (document.hasExplanation()) {
      return document;
    }

    const textToExplain = document.extractedText;
    if (!textToExplain || textToExplain.trim() === "") {
      throw new Error("Cannot consult the Caterpillar on an empty document text.");
    }

    // Query explanation adapter to translate into "normal people terms"
    const caterpillarsAdvice = await this.explanationPort.generateExplanation(textToExplain);

    // Attach domain entity
    document.setExplanation(caterpillarsAdvice);

    // Cache/write changes to storage
    await this.storagePort.saveDocument(document);

    return document;
  }

  // Adapter method to implement the ExplainTextUseCase contract interface
  public async executeExplainText(request: ExplainTextRequest): Promise<Document> {
    return this.executeExplanation(request);
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
