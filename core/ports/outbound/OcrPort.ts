/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - represents an outbound port decoupling business logic from concrete vision models)
- Revision Action Taken: Converted extractText to accept an array of Buffer elements to support multi-image OCR requests simultaneously.
---
*/

export interface OcrPort {
  extractText(fileBuffers: Buffer[]): Promise<string>;
}
