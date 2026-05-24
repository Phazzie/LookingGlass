/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (pure type-safe TS interface with Buffer abstraction)
- Revision Action Taken: Used the standard Node.js Buffer type which is decoupled from any specific library.
*/

export interface OcrPort {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<string>;
}
