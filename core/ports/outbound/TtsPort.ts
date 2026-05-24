/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (decoupled from any specific audio technology or storage location)
- Revision Action Taken: Designed method signature to receive the target synthesisation text and target destination filename, returning the resolved path.
*/

export interface TtsPort {
  synthesizeSpeech(text: string, destinationFilename: string): Promise<string>;
}
