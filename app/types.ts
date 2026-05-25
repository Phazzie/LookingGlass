export interface GlossaryItem {
  term: string;
  definition: string;
}

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
    glossary: GlossaryItem[];
    focusSessionScript?: Array<{ speaker: "Narrator" | "Alice"; text: string }>;
  };
}
