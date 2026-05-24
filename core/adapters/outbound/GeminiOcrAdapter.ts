/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (implements OcrPort from ports, wraps Google GenAI SDK integration)
- Revision Action Taken: Ensured 'aistudio-build' User-Agent is sent for telemetry, used standard named constructor parameter initialization, and returned raw extracted text cleanly.
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
   * Extracts text, codes, math equations from textbook/assignment screenshot buffer.
   */
  public async extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Cannot perform OCR on an empty file buffer.");
    }

    const base64Data = fileBuffer.toString("base64");

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        "Extract and transcribe all text, instructions, equations, or code from this screenshot image cleanly. Return only the extracted text exactly as it appears in the image, preserving structural readability (like paragraphs and list items). Do not add any intro, conversational preamble, or markdown code block formatting—just return the raw text."
      ]
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini returned an empty response for text extraction.");
    }

    return resultText;
  }
}
