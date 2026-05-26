export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { documentService, serializeDocument } from "../../../../core/di";
import { AppError } from "../../../../core/errors/AppErrors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await context.params;
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Document ID parameter is required." }, { status: 400 });
    }
    const document = await documentService.getById(id, session.user.id);
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    return NextResponse.json(serializeDocument(document), { status: 200 });
  } catch (error) {
    console.error("[GET /api/documents/[id]]", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatusCode });
    }
    return NextResponse.json({ error: "Failed to retrieve document." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await context.params;
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Document ID parameter is required." }, { status: 400 });
    }
    const document = await documentService.getById(id, session.user.id);
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    await documentService.delete(id, session.user.id);
    return NextResponse.json(
      { message: `Document '${id}' was purged from archives successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/documents/[id]]", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatusCode });
    }
    return NextResponse.json({ error: "Failed to delete document." }, { status: 500 });
  }
}
