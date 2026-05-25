/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (delivery route adapter, converts dynamic parameters and routes to service endpoints)
- Revision Action Taken: Properly declared types for Next.js 15 asynchronous dynamic routing params, awaited them, and mapped responses using serialization structures.
*/

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../../core/di";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET: Retrieve details of a single document by its unique ID.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Document ID parameter is required." }, { status: 400 });
    }

    const document = await documentService.getById(id);

    if (!document) {
      return NextResponse.json(
        { error: `Document with ID '${id}' could not be found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeDocument(document), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to retrieve document: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remotely unlink screen captures and purge metadata representations from db files.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Document ID parameter is required." }, { status: 400 });
    }

    const document = await documentService.getById(id);

    if (!document) {
      return NextResponse.json(
        { error: `Document with ID '${id}' does not exist or has already been deleted.` },
        { status: 404 }
      );
    }

    await documentService.delete(id);

    return NextResponse.json(
      { message: `Document '${id}' were cleaned up and purged from archives successfully.` },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to clean up archives record: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
