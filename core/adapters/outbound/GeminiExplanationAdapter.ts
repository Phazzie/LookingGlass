/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (implements ExplanationPort outbound adapter, constructs domain CaterpillarsAdvice entity)
- Revision Action Taken: Utilized official `@google/genai` JSON schema `Type` configurations, injected client-specific headers, structured the Wise Caterpillar instructions completely, and handled parsing safety cleanly.
---
*/

import { GoogleGenAI, Type } from "@google/genai";
import { ExplanationPort } from "../../ports/outbound/ExplanationPort";
import { CaterpillarsAdvice, GlossaryItem } from "../../domain/CaterpillarsAdvice";

export class GeminiExplanationAdapter implements ExplanationPort {
  private readonly ai: GoogleGenAI;
  private readonly modelName: string;

  constructor(apiKey: string, modelName: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API Key for Gemini cannot be empty.");
    }
    if (!modelName || modelName.trim() === "") {
      throw new Error("Model Name for Gemini Explanation cannot be empty.");
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
  }

  /**
   * Generates Caterpillar's advice wrapping academic logic into normal, clear terms.
   */
  public async generateExplanation(denseText: string): Promise<CaterpillarsAdvice> {
    if (!denseText || denseText.trim() === "") {
      throw new Error("Cannot explain an empty block of academic text.");
    }

    const systemInstruction = 
      "You are the Wise Caterpillar. Take this dense academic text and translate it into clear, accessible, and engaging English for adult college students who are returning to school after a long break. Do not water down the intellectual rigor of the material; instead, unpack complex sentences, define academic jargon clearly, and use helpful, mature, real-world analogies to make the core arguments obvious and understandable.";

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: `Please unpack and explain this academic text:\n\n${denseText}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanationText: {
              type: Type.STRING,
              description: "The core translated translation/explanation of the dense academic text in clear, mature, real-world analogies and simple language."
            },
            glossary: {
              type: Type.ARRAY,
              description: "A list of complex jargon, scholarly abbreviations, theoretical constructs, or names found in the reading.",
              items: {
                type: Type.OBJECT,
                properties: {
                  term: {
                    type: Type.STRING,
                    description: "The complex academic keyword, jargon or phrase."
                  },
                  definition: {
                    type: Type.STRING,
                    description: "Its translation, context, or simple explanation."
                  }
                },
                required: ["term", "definition"]
              }
            }
          },
          required: ["explanationText", "glossary"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Caterpillar returned an empty response.");
    }

    try {
      const parsed = JSON.parse(jsonText.trim());
      
      const explanationText = parsed.explanationText || "";
      const rawGlossary = parsed.glossary || [];
      
      const glossary: GlossaryItem[] = rawGlossary.map((item: { term?: string; definition?: string }) => ({
        term: item.term || "Keyword",
        definition: item.definition || "Definition"
      }));

      // Instantialize the domain object to trigger its internal validation rules
      return new CaterpillarsAdvice(explanationText, glossary);
    } catch (error) {
      throw new Error(`Failed to parse the Caterpillar's JSON response: ${(error as Error).message}`);
    }
  }
}
