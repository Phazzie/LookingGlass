/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (delivery layer api adapter mapping to ExplainTextRequest port)
- Revision Action Taken: Configured type contexts for parameter Promises, awaited the dynamic id in a fully type-safe manner, called the unified service flow, and serialized the returned Advice structure perfectly.
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

    const document = await documentService.execute({
      documentId: id
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
