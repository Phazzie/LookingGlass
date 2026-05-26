/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - Intercepts HTTP request contexts mapping strict validation prior to internal execution).
- Revision Action Taken: Plumbed in precise IP-level rate limiting, robust application error parsing, and structured generic failure fallback guarding internal mechanisms from client leakage.
---
*/

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../../../core/di";
import { explainRateLimiter } from "../../../../../core/utils/RateLimiter";
import { AppError } from "../../../../../core/errors/AppErrors";

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
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    if (!explainRateLimiter.checkLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "The Caterpillar is overwhelmed. Please wait before asking for more advice." },
        { status: 429 }
      );
    }

    const { id } = await context.params;

    if (!id || id.trim() === "") {
      return NextResponse.json({ success: false, error: "Document ID parameter is required." }, { status: 400 });
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
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.httpStatusCode }
      );
    }
    
    // Log unknown unhandled errors safely behind the server boundaries
    console.error("[Explanation Route Error]", error);

    return NextResponse.json(
      { success: false, error: "A mysterious anomaly occurred in Wonderland." },
      { status: 500 }
    );
  }
}
