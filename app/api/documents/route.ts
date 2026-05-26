/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes
- Revision Action Taken: Appended auth check, extracted session.user.id for documentService execution, securely logged backend errors, and fixed rate-limit parsing for x-forwarded-for parsing, clamping it to the first IP. Added max files check.
*/

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../core/di";
import { uploadRateLimiter } from "../../../core/utils/RateLimiter";
import { SecurityValidator } from "../../../core/utils/SecurityValidator";
import { auth } from "../../../auth";

export async function GET(req: NextRequest) {
  try {
    SecurityValidator.validateEnvironment();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : "unknown_ip";
    if (!uploadRateLimiter.checkLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "The Caterpillar is thinking too fast! Please wait a moment before sending more queries." },
        { status: 429 }
      );
    }

    const documents = await documentService.getAll(session.user.id);
    const serialized = documents.map(serializeDocument);
    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error(`[GET /api/documents] Error:`, (error as Error).message);
    return NextResponse.json(
      { success: false, error: `Failed to retrieve documents: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    SecurityValidator.validateEnvironment();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : "unknown_ip";
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

    const MAX_FILE_COUNT = 10;
    if (rawFilesList.length > MAX_FILE_COUNT) {
      return NextResponse.json(
        { success: false, error: `Too many files. Maximum allowed is ${MAX_FILE_COUNT}.` },
        { status: 400 }
      );
    }

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

    const documentEntity = await documentService.execute({
      userId: session.user.id,
      files: processedFiles
    });

    const serializedDoc = serializeDocument(documentEntity);
    return NextResponse.json(serializedDoc, { status: 201 });
  } catch (error) {
    console.error(`[POST /api/documents] Error:`, (error as Error).message);
    const errMsg = (error as Error).message;
    let userFriendlyMsg = `Failed to process uploaded textbook screenshot. Please try again later.`;
    let statusCode = 500;

    if (
      errMsg.includes("No textbook screenshots") ||
      errMsg.includes("exceeds the 20MB limit") ||
      errMsg.includes("Invalid file type") ||
      errMsg.includes("Invalid file extension")
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
