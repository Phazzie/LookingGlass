/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes
- Revision Action Taken: Appended auth check, returned generic server errors for the client masking underlying stack info, extracted session userId for multi-tenant id-filtering compliance.
*/

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../../core/di";
import { auth } from "../../../../auth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Document ID parameter is required." }, { status: 400 });
    }

    const document = await documentService.getById(session.user.id, id);
    if (!document) {
      return NextResponse.json(
        { error: `Document with ID '${id}' could not be found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeDocument(document), { status: 200 });
  } catch (error) {
    console.error(`[GET /api/documents/:id] Error:`, (error as Error).message);
    return NextResponse.json(
      { error: `Failed to retrieve document: An internal server error occurred.` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Document ID parameter is required." }, { status: 400 });
    }

    const document = await documentService.getById(session.user.id, id);
    if (!document) {
      return NextResponse.json(
        { error: `Document with ID '${id}' does not exist or has already been deleted.` },
        { status: 404 }
      );
    }

    await documentService.delete(session.user.id, id);

    return NextResponse.json(
      { message: `Document '${id}' was cleaned up and purged from archives successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[DELETE /api/documents/:id] Error:`, (error as Error).message);
    return NextResponse.json(
      { error: `Failed to clean up archives record: An internal server error occurred.` },
      { status: 500 }
    );
  }
}
