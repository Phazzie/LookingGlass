/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - connects only with our domain types and outbound port specification)
- Revision Action Taken: Configured precise Type parameters for schemas. Calculated conversational pace of 150 words-per-minute dynamically, formulated the dual-speaker narrative prompt boundaries, and mapped JSON responses cleanly to CaterpillarsAdvice domain entities.
---
*/

import { GoogleGenAI, Type } from "@google/genai";
import { ExplanationPort } from "../../ports/outbound/ExplanationPort";
import { CaterpillarsAdvice, GlossaryItem, FocusSessionLine } from "../../domain/CaterpillarsAdvice";

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
          "User-Agent": "aistudio-build",
        },
      },
    });
    this.modelName = modelName;
  }

  /**
   * Generates Caterpillar's advice, incorporating "The Mad Hatter's Tea Time" dual-voice dynamic.
   */
  public async generateExplanation(
    denseText: string,
    focusTimeMinutes?: number
  ): Promise<CaterpillarsAdvice> {
    if (!denseText || denseText.trim() === "") {
      throw new Error("Cannot explain an empty block of academic text.");
    }

    // Default focus session session length to 5 minutes if not specified
    const activeFocusMinutes = focusTimeMinutes && focusTimeMinutes > 0 ? focusTimeMinutes : 5;
    const targetWordCount = activeFocusMinutes * 150;

    const systemInstruction = 
      "You are the Wise Caterpillar. Take this dense academic text and translate it into clear, accessible, and engaging English for adult college students who are returning to school after a long break. Do not water down the intellectual rigor of the material; instead, unpack complex sentences, define academic jargon clearly, and use helpful, mature, real-world analogies to make the core arguments obvious and understandable.\n\n" +
      "Additionally, you must design a structured study script segment for 'The Mad Hatter's Tea Time' (A Focus-Boxed Study Session). This is a paced, dual-voice session structured to hold the student's attention. The voices are:\n" +
      "1. 'Narrator': Authoritative, reassuring, and warm. Reads and reviews core absolute concepts of the text.\n" +
      "2. 'Alice': Insatiably curious, relatable, and keen to learn. She interjects with clarifying queries, offers real-world micro-analogies, and breaks down the narrator's descriptions into digestible takeaways.";

    const promptMessage = 
      `The user has requested a focus session of ${activeFocusMinutes} minutes. At an average conversational speaking pace of 150 words per minute, you must generate a script that is approximately ${targetWordCount} words long across all speakers.\n\n` +
      `Create the dual-voice dialogue script based on the academic textbook text below:\n\n${denseText}`;

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: promptMessage,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanationText: {
              type: Type.STRING,
              description: "The core overview/explanation of the textbook passage described in clear, encouraging, mature English."
            },
            glossary: {
              type: Type.ARRAY,
              description: "A glossary list mapping scholarly jargon or abbreviations found in the source text.",
              items: {
                type: Type.OBJECT,
                properties: {
                  term: {
                    type: Type.STRING,
                    description: "The jargon phrase or scholarly word."
                  },
                  definition: {
                    type: Type.STRING,
                    description: "Contextual explanation/translation in simple terms."
                  }
                },
                required: ["term", "definition"]
              }
            },
            focusSessionScript: {
              type: Type.ARRAY,
              description: "The full dual-voice dialogue timeline script structured for interactive playback.",
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: {
                    type: Type.STRING,
                    enum: ["Narrator", "Alice"],
                    description: "The speaker reading this line."
                  },
                  text: {
                    type: Type.STRING,
                    description: "What the speaker is saying."
                  }
                },
                required: ["speaker", "text"]
              }
            }
          },
          required: ["explanationText", "glossary", "focusSessionScript"]
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
      const rawScript = parsed.focusSessionScript || [];
      
      const glossary: GlossaryItem[] = rawGlossary.map((item: { term?: string; definition?: string }) => ({
        term: item.term || "Keyword",
        definition: item.definition || "Definition"
      }));

      const focusSessionScript: FocusSessionLine[] = rawScript.map((item: { speaker?: string; text?: string }) => ({
        speaker: item.speaker === "Alice" ? "Alice" : "Narrator",
        text: item.text || "..."
      }));

      // Return instantiated domain object carrying the script
      return new CaterpillarsAdvice(explanationText, glossary, focusSessionScript);
    } catch (error) {
      throw new Error(`Failed to parse the Caterpillar's JSON response: ${(error as Error).message}`);
    }
  }
}
