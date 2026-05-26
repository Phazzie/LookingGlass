import fs from "fs";
import path from "path";
import { Document } from "./domain/Document";
import { LocalStorageAdapter } from "./adapters/outbound/LocalStorageAdapter";
import { PostgresStorageAdapter } from "./adapters/outbound/PostgresStorageAdapter";
import { GeminiOcrAdapter } from "./adapters/outbound/GeminiOcrAdapter";
import { GeminiExplanationAdapter } from "./adapters/outbound/GeminiExplanationAdapter";
import { GeminiTtsAdapter } from "./adapters/outbound/GeminiTtsAdapter";
import { DocumentService } from "./services/DocumentService";

// Store uploads and audio outside /public/ so they are not directly accessible
const DATA_DIR = path.resolve("./data");
const UPLOAD_DIR = path.resolve("./data/uploads");
const AUDIO_DIR = path.resolve("./data/audio");

for (const dir of [DATA_DIR, UPLOAD_DIR, AUDIO_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const apiKey = process.env.GEMINI_API_KEY || "";
const SELECTED_MODEL = "gemini-2.5-flash";

const ocrAdapter = new GeminiOcrAdapter(apiKey, SELECTED_MODEL);
const explanationAdapter = new GeminiExplanationAdapter(apiKey, SELECTED_MODEL);
const ttsAdapter = new GeminiTtsAdapter(apiKey, SELECTED_MODEL, AUDIO_DIR);

const storageAdapter = process.env.DATABASE_URL
  ? new PostgresStorageAdapter(UPLOAD_DIR, AUDIO_DIR)
  : new LocalStorageAdapter(path.join(DATA_DIR, "db.json"), UPLOAD_DIR, AUDIO_DIR);

export const documentService = new DocumentService(
  ocrAdapter,
  ttsAdapter,
  storageAdapter,
  explanationAdapter
);

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

export function serializeDocument(doc: Document): SerializableDocument {
  return {
    id: doc.id,
    title: doc.title,
    originalFilename: doc.originalFilenames[0] ?? "",
    originalFilenames: doc.originalFilenames,
    extractedText: doc.extractedText,
    audioUrl: doc.audioUrl,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
    explanation: doc.explanation
      ? {
          explanationText: doc.explanation.explanationText,
          glossary: doc.explanation.glossary,
          focusSessionScript: doc.explanation.focusSessionScript,
        }
      : undefined,
  };
}
