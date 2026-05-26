/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (Defines pure interfaces for client delivery).
- Revision Action Taken: Created isolated typings file covering the serializable output boundary shapes.
---
*/

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface FocusSessionLine {
  speaker: "Narrator" | "Alice";
  text: string;
}

export interface SerializableDocument {
  id: string;
  userId: string;
  title: string;
  originalFilename: string;
  originalFilenames?: string[];
  filePaths?: string[];
  extractedText?: string;
  audioUrl?: string;
  createdAt: string;
  explanation?: {
    explanationText: string;
    glossary: GlossaryItem[];
    focusSessionScript?: FocusSessionLine[];
  };
}
