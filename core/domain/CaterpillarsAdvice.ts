/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes)
- Revision Action Taken: Added a validateable 'focusSessionScript' property to represent the Mad Hatter's dual-voice interactive audio timeline, including strict runtime type safety and deep property validations on speakers and texts.
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

export class CaterpillarsAdvice {
  private readonly _explanationText: string;
  private readonly _glossary: GlossaryItem[];
  private readonly _focusSessionScript?: FocusSessionLine[];

  constructor(
    explanationText: string,
    glossary: GlossaryItem[],
    focusSessionScript?: FocusSessionLine[]
  ) {
    if (!explanationText || explanationText.trim() === "") {
      throw new Error("Explanation text cannot be empty.");
    }

    if (!Array.isArray(glossary)) {
      throw new Error("Glossary must be a valid array.");
    }

    const validatedGlossary: GlossaryItem[] = [];
    for (const item of glossary) {
      if (!item || typeof item !== "object") {
        throw new Error("Glossary item must be an object.");
      }
      if (!item.term || item.term.trim() === "") {
        throw new Error("Glossary item term cannot be empty.");
      }
      if (!item.definition || item.definition.trim() === "") {
        throw new Error("Glossary item definition cannot be empty.");
      }
      validatedGlossary.push({
        term: item.term.trim(),
        definition: item.definition.trim()
      });
    }

    let validatedScript: FocusSessionLine[] | undefined;
    if (focusSessionScript !== undefined) {
      if (!Array.isArray(focusSessionScript)) {
        throw new Error("Focus session script must be a valid array.");
      }
      validatedScript = [];
      for (const line of focusSessionScript) {
        if (!line || typeof line !== "object") {
          throw new Error("Each line in the focus session script must be an object.");
        }
        if (line.speaker !== "Narrator" && line.speaker !== "Alice") {
          throw new Error("Focus script speaker must be either 'Narrator' or 'Alice'.");
        }
        if (!line.text || line.text.trim() === "") {
          throw new Error("Focus script text cannot be empty.");
        }
        validatedScript.push({
          speaker: line.speaker,
          text: line.text.trim()
        });
      }
    }

    this._explanationText = explanationText.trim();
    this._glossary = validatedGlossary;
    this._focusSessionScript = validatedScript;
  }

  public get explanationText(): string {
    return this._explanationText;
  }

  public get glossary(): GlossaryItem[] {
    return [...this._glossary];
  }

  public get focusSessionScript(): FocusSessionLine[] | undefined {
    if (this._focusSessionScript === undefined) {
      return undefined;
    }
    return [...this._focusSessionScript];
  }
}
