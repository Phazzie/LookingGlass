export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../core/di";
import { uploadRateLimiter } from "../../../core/utils/RateLimiter";
import { SecurityValidator } from "../../../core/utils/SecurityValidator";

/**
 * GET: Retrieve all transcribed documents from stored registry database sorted newest to oldest.
 */
export async function GET(req: NextRequest) {
  try {
    SecurityValidator.validateEnvironment();

    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    if (!uploadRateLimiter.checkLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "The Caterpillar is thinking too fast! Please wait a moment before sending more queries." },
        { status: 429 }
      );
    }

    const documents = await documentService.getAll();
    const serialized = documents.map(serializeDocument);
    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Failed to retrieve documents: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * POST: Handles "Drink Me" screenshot upload targets. Processes the raw screenshots 
 * using multimodal OCR, synthesizes TTS audio watch files, and stores document metadata.
 */
export async function POST(req: NextRequest) {
  try {
    SecurityValidator.validateEnvironment();

    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    if (!uploadRateLimiter.checkLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "The magical inkwell ran dry. Please wait a moment before distilling more scrolls." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    
    const filesAttr = formData.getAll("files") as File[];
    const fileAttr = formData.get("file") as File | null;
    const rawFilesList = filesAttr.length > 0 ? filesAttr : (fileAttr ? [fileAttr] : []);

    SecurityValidator.validateFiles(rawFilesList);

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
        { success: false, error: "No valid image files found inside uploaded parameters." },
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
    const errMsg = (error as Error).message;
    let userFriendlyMsg = `Failed to process uploaded textbook screenshot: ${errMsg}`;
    let statusCode = 500;

    if (
      errMsg.includes("No textbook screenshots") ||
      errMsg.includes("exceeds the 20MB limit") ||
      errMsg.includes("Invalid file type")
    ) {
      userFriendlyMsg = errMsg;
      statusCode = 400;
    } else if (errMsg.includes("429") || errMsg.includes("Too Many Requests") || errMsg.toLowerCase().includes("quota")) {
      userFriendlyMsg = "The Caterpillar's hookah is exhausted (Gemini Rate Limit). Please wait a moment before requesting more wisdom.";
    }

    return NextResponse.json(
      { success: false, error: userFriendlyMsg },
      { status: statusCode }
    );
  }
}
