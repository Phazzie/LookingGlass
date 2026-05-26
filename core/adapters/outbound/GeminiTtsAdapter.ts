/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - implements TtsPort outbound adaptation)
- Revision Action Taken: Converted fs.writeFileSync to fs/promises.writeFile for non-blocking I/O. Relocated conversational/reading prompt into systemInstructions to prevent injection attack vectors.
---
*/

import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { GoogleGenAI, Modality } from "@google/genai";
import { TtsPort } from "../../ports/outbound/TtsPort";

export class GeminiTtsAdapter implements TtsPort {
  private readonly ai: GoogleGenAI;
  private readonly modelName: string;
  private readonly audioDir: string;

  constructor(apiKey: string, modelName: string, audioDir: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API Key for Gemini TTS cannot be empty.");
    }
    if (!modelName || modelName.trim() === "") {
      throw new Error("Model Name for Gemini TTS cannot be empty.");
    }
    if (!audioDir || audioDir.trim() === "") {
      throw new Error("Audio directory target path cannot be empty.");
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
    this.audioDir = audioDir;
  }

  public async synthesizeSpeech(text: string, destinationFilename: string): Promise<string> {
    if (!text || text.trim() === "") {
      throw new Error("Cannot synthesize speech from an empty text block.");
    }
    if (!destinationFilename || destinationFilename.trim() === "") {
      throw new Error("Saved audio destination filename cannot be empty.");
    }

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: [{ parts: [{ text: text }] }],
      config: {
        systemInstruction: "Read this text aloud exactly as written, with no extra conversational preamble or introductory comment.",
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck"
            }
          }
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    let base64Audio: string | undefined;

    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Audio = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Audio) {
      throw new Error("No inline audio data returned from the Gemini text-to-speech engine.");
    }

    const finalFilePath = path.join(this.audioDir, destinationFilename);
    const audioDirectory = path.dirname(finalFilePath);

    if (!fs.existsSync(audioDirectory)) {
      await fsPromises.mkdir(audioDirectory, { recursive: true });
    }

    const audioBuffer = Buffer.from(base64Audio, "base64");
    await fsPromises.writeFile(finalFilePath, audioBuffer);

    return destinationFilename;
  }
}
