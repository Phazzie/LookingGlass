/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (delivery layer adapter, resolves JSON inputs and streams to core domain services)
- Revision Action Taken: Used native Next.js NextRequest and NextResponse, extracted Buffer from uploaded Files cleanly without third-party package overhead, and safely wrapped errors in standardized JSON formats.
*/

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../core/di";

/**
 * GET: Retrieve all transcribed documents from stored registry database sorted newest to oldest.
 */
export async function GET() {
  try {
    const documents = await documentService.getAll();
    const serialized = documents.map(serializeDocument);
    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to retrieve documents: ${(error as Error).message}` },
      { status: 500 }
    ) ;
  }
}

/**
 * POST: Handles "Drink Me" screenshot upload targets. Processes the raw screenshots 
 * using multimodal OCR, synthesizes TTS audio watch files, and stores document metadata.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file was attached in the request form-data." },
        { status: 400 }
      );
    }

    const originalFilename = file.name || "screenshot.png";
    const mimeType = file.type || "image/png";

    // Convert file representation to Node.js Buffer safely
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    // Orchestrate process through core service port boundaries
    const documentEntity = await documentService.execute({
      fileBuffer,
      originalFilename,
      mimeType
    });

    const serializedDoc = serializeDocument(documentEntity);

    return NextResponse.json(serializedDoc, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process uploaded textbook screenshot: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
