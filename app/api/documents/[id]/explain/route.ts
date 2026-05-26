/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes)
- Revision Action Taken: Appended auth check, returned generic server errors for the client, extracted session userId for multi-tenant id-filtering compliance. Fixed x-forwarded-for rate limit parsing.
---
*/

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../../../core/di";
import { explainRateLimiter } from "../../../../../core/utils/RateLimiter";
import { AppError } from "../../../../../core/errors/AppErrors";
import { auth } from "../../../../../auth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : "unknown_ip";
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
      userId: session.user.id,
      documentId: id,
      focusTimeMinutes
    });

    const serialized = serializeDocument(document);

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error("[Explanation Route Error]", error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: "Validation Error. Please check parameters." },
        { status: error.httpStatusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "A mysterious anomaly occurred in Wonderland." },
      { status: 500 }
    );
  }
}
