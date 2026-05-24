/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - implements the updated OcrPort interface completely)
- Revision Action Taken: Converted extractText to take an array of Buffer objects, mapped each buffer dynamically to base64 inlineData with checked mimeType offsets, and dispatched them cohesively to the unified @google/genai client.
---
*/

import { GoogleGenAI } from "@google/genai";
import { OcrPort } from "../../ports/outbound/OcrPort";

export class GeminiOcrAdapter implements OcrPort {
  private readonly ai: GoogleGenAI;
  private readonly modelName: string;

  constructor(apiKey: string, modelName: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API Key for Gemini cannot be empty.");
    }
    if (!modelName || modelName.trim() === "") {
      throw new Error("Model Name for Gemini OCR cannot be empty.");
    }

    this.ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    this.modelName = modelName;
  }

  /**
   * Helper to detect mime type based on magic bytes of image buffer
   */
  private getMimeType(buffer: Buffer): string {
    if (buffer.length > 4) {
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return "image/png";
      }
      if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "image/jpeg";
      }
      if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
        return "image/gif";
      }
      if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return "application/pdf";
      }
    }
    return "image/png"; // Default fallback
  }

  /**
   * Extracts text, codes, math equations from sequential textbook/assignment screenshot buffers.
   */
  public async extractText(fileBuffers: Buffer[]): Promise<string> {
    if (!Array.isArray(fileBuffers) || fileBuffers.length === 0) {
      throw new Error("Cannot perform OCR on empty or missing file buffers list.");
    }

    const contents: any[] = [];

    // Map each buffer into inlineData containing base64 payload and appropriate MIME type
    for (const buffer of fileBuffers) {
      if (!buffer || buffer.length === 0) {
        throw new Error("Found an empty file buffer inside compilation target files.");
      }
      contents.push({
        inlineData: {
          mimeType: this.getMimeType(buffer),
          data: buffer.toString("base64")
        }
      });
    }

    // Append instructions block
    contents.push(
      "These are sequential screenshots of a dense academic document. Read them in order and extract all text cohesively. Extract and transcribe all text, instructions, equations, or code from these screenshot images cleanly. Return only the extracted text exactly as it appears in the images, preserving structural readability (like paragraphs and list items). Do not add any intro, conversational preamble, or markdown code block formatting—just return the raw text."
    );

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: contents
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini returned an empty response for multi-image text extraction.");
    }

    return resultText;
  }
}
