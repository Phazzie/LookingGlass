/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes)
- Revision Action Taken: Expanded core ExplanationPort signature contracts to handle optional focus duration indicators.
---
*/

import { CaterpillarsAdvice } from "../../domain/CaterpillarsAdvice";

export interface ExplanationPort {
  generateExplanation(denseText: string, focusTimeMinutes?: number): Promise<CaterpillarsAdvice>;
}
