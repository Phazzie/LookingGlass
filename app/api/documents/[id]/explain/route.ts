export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { documentService, serializeDocument } from "../../../../../core/di";
import { explainRateLimiter } from "../../../../../core/utils/RateLimiter";
import { AppError } from "../../../../../core/errors/AppErrors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
  return ips[ips.length - 1] || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    explainRateLimiter.check(getClientIp(req));

    const { id } = await context.params;
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Document ID parameter is required." }, { status: 400 });
    }

    let focusTimeMinutes: number | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.focusTimeMinutes === "number") {
        focusTimeMinutes = Math.min(Math.max(body.focusTimeMinutes, 1), 60);
      }
    } catch {
      // empty or non-JSON body — proceed without focusTimeMinutes
    }

    const document = await documentService.execute({
      userId: session.user.id,
      documentId: id,
      focusTimeMinutes,
    });

    return NextResponse.json(serializeDocument(document), { status: 200 });
  } catch (error) {
    console.error("[POST /api/documents/[id]/explain]", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatusCode });
    }
    return NextResponse.json({ error: "The Wise Caterpillar met with a distraction." }, { status: 500 });
  }
}
