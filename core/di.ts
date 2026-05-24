/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - represents the wiring configuration boundary)
- Revision Action Taken: Added 'focusSessionScript' to SerializableDocument interface and serializeDocument mapping so the Mad Hatter's dialogue script is parsed to UI boundaries.
---
*/

import fs from "fs";
import path from "path";
import { LocalStorageAdapter } from "./adapters/outbound/LocalStorageAdapter";
import { GeminiOcrAdapter } from "./adapters/outbound/GeminiOcrAdapter";
import { GeminiExplanationAdapter } from "./adapters/outbound/GeminiExplanationAdapter";
import { GeminiTtsAdapter } from "./adapters/outbound/GeminiTtsAdapter";
import { DocumentService } from "./services/DocumentService";

// Safe directory initialization
const DATA_DIR = path.resolve("./data");
const UPLOAD_DIR = path.resolve("./public/uploads");
const AUDIO_DIR = path.resolve("./public/audio");

for (const dir of [DATA_DIR, UPLOAD_DIR, AUDIO_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const dbPath = path.join(DATA_DIR, "db.json");

// Retrieve API credential key safely
const apiKey = process.env.GEMINI_API_KEY || "";

// We use modern gemini-2.5-flash for balanced cost, high performance OCR, explanations & voice synthesis native capabilities.
const SELECTED_MODEL = "gemini-2.5-flash";

// 1. Initialize Outbound Adapters
const storageAdapter = new LocalStorageAdapter(dbPath, UPLOAD_DIR);
const ocrAdapter = new GeminiOcrAdapter(apiKey, SELECTED_MODEL);
const explanationAdapter = new GeminiExplanationAdapter(apiKey, SELECTED_MODEL);
const ttsAdapter = new GeminiTtsAdapter(apiKey, SELECTED_MODEL, AUDIO_DIR);

// 2. Instantiate and Export Document Core Orchestration Service
export const documentService = new DocumentService(
  ocrAdapter,
  ttsAdapter,
  storageAdapter,
  explanationAdapter
);

// 3. Document serialization utility for JSON API boundaries
export interface SerializableDocument {
  id: string;
  title: string;
  originalFilename: string;
  originalFilenames?: string[];
  extractedText?: string;
  audioUrl?: string;
  createdAt: string;
  explanation?: {
    explanationText: string;
    glossary: Array<{ term: string; definition: string }>;
    focusSessionScript?: Array<{ speaker: "Narrator" | "Alice"; text: string }>;
  };
}

export function serializeDocument(doc: any): SerializableDocument {
  return {
    id: doc.id,
    title: doc.title,
    originalFilename: doc.originalFilenames && doc.originalFilenames[0] ? doc.originalFilenames[0] : (doc.originalFilename || ""),
    originalFilenames: doc.originalFilenames || (doc.originalFilename ? [doc.originalFilename] : []),
    extractedText: doc.extractedText,
    audioUrl: doc.audioUrl,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
    explanation: doc.explanation ? {
      explanationText: doc.explanation.explanationText,
      glossary: doc.explanation.glossary,
      focusSessionScript: doc.explanation.focusSessionScript
    } : undefined
  };
}
