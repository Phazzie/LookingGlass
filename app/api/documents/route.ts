/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - delivery boundary translating HTTP multiform assets to use-cases)
- Revision Action Taken: Converted the POST endpoint to read singular 'file' or multiple 'files' fields, mapped Web File structures to raw Node.js byte buffers, and executed the updated use-case seamlessly.
---
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
    
    const filesAttr = formData.getAll("files") as File[];
    const fileAttr = formData.get("file") as File | null;
    const rawFilesList = filesAttr.length > 0 ? filesAttr : (fileAttr ? [fileAttr] : []);

    if (rawFilesList.length === 0) {
      return NextResponse.json(
        { error: "No textbook screenshots were uploaded." },
        { status: 400 }
      );
    }

    const processedFiles: Array<{ fileBuffer: Buffer; originalFilename: string; mimeType: string }> = [];

    for (const file of rawFilesList) {
      if (file && typeof file.arrayBuffer === "function") {
        const bytes = await file.arrayBuffer();
        processedFiles.push({
          fileBuffer: Buffer.from(bytes),
          originalFilename: file.name || "screenshot.png",
          mimeType: file.type || "image/png"
        });
      }
    }

    if (processedFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid image files found inside uploaded parameters." },
        { status: 400 }
      );
    }

    // Orchestrate process through core service port boundaries
    const documentEntity = await documentService.execute({
      files: processedFiles
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
