import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { documentService, serializeDocument } from "../../../../../core/di";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

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
    return NextResponse.json({ error: "The Wise Caterpillar met with a distraction." }, { status: 500 });
  }
}
