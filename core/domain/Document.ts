/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (pure TS domain, imports only from sibling domain files)
- Revision Action Taken: Wrapped the self-critique block in standard TypeScript multi-line comments to pass linter and parser rules.
*/

import { CaterpillarsAdvice } from "./CaterpillarsAdvice";

export class Document {
  private readonly _id: string;
  private readonly _title: string;
  private readonly _originalFilename: string;
  private _extractedText: string | undefined;
  private _audioUrl: string | undefined;
  private readonly _createdAt: Date;
  private _explanation: CaterpillarsAdvice | undefined;

  constructor(
    id: string,
    title: string,
    originalFilename: string,
    createdAt: Date,
    extractedText?: string,
    audioUrl?: string,
    explanation?: CaterpillarsAdvice
  ) {
    if (!id || id.trim() === "") {
      throw new Error("Document ID cannot be empty.");
    }
    if (!title || title.trim() === "") {
      throw new Error("Document title cannot be empty.");
    }
    if (!originalFilename || originalFilename.trim() === "") {
      throw new Error("Original filename cannot be empty.");
    }
    if (!(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
      throw new Error("A valid creation date is required.");
    }

    this._id = id.trim();
    this._title = title.trim();
    this._originalFilename = originalFilename.trim();
    this._createdAt = createdAt;
    this._extractedText = extractedText ? extractedText.trim() : undefined;
    this._audioUrl = audioUrl ? audioUrl.trim() : undefined;
    this._explanation = explanation;
  }

  // Strongly typed getters for all properties
  public get id(): string {
    return this._id;
  }

  public get title(): string {
    return this._title;
  }

  public get originalFilename(): string {
    return this._originalFilename;
  }

  public get extractedText(): string | undefined {
    return this._extractedText;
  }

  public get audioUrl(): string | undefined {
    return this._audioUrl;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get explanation(): CaterpillarsAdvice | undefined {
    return this._explanation;
  }

  // State-modifying business logic methods
  public setExtractedText(text: string): void {
    if (!text || text.trim() === "") {
      throw new Error("Extracted text cannot be empty.");
    }
    this._extractedText = text.trim();
  }

  public setAudioUrl(url: string): void {
    if (!url || url.trim() === "") {
      throw new Error("Audio URL cannot be empty.");
    }
    this._audioUrl = url.trim();
  }

  public setExplanation(advice: CaterpillarsAdvice): void {
    if (!advice) {
      throw new Error("Explanation advice cannot be null or undefined.");
    }
    this._explanation = advice;
  }

  public hasExplanation(): boolean {
    return this._explanation !== undefined && this._explanation !== null;
  }
}
