/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - Delivery adapter translating HTTP payload parameters to inward use cases)
- Revision Action Taken: Upgraded the POST handler to check the JSON request body for 'focusTimeMinutes' parameter, translating details seamlessly to the DocumentService execute call.
---
*/

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../../../core/di";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST: Invokes explanation logic representing the Wise Caterpillar's advice.
 * Unpacks academic texts, structures terms in a glossary, and performs caching.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Document ID parameter is required." }, { status: 400 });
    }

    let focusTimeMinutes: number | undefined = undefined;
    try {
      const body = await req.json();
      if (body && typeof body.focusTimeMinutes === "number") {
        focusTimeMinutes = body.focusTimeMinutes;
      }
    } catch {
      // Body might be empty or missing JSON payload, carry forward with undefined
    }

    const document = await documentService.execute({
      documentId: id,
      focusTimeMinutes
    });

    const serialized = serializeDocument(document);

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `The Wise Caterpillar met with a distraction: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
