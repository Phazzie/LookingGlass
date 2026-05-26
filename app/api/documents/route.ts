export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { documentService, serializeDocument } from "../../../core/di";
import { uploadRateLimiter } from "../../../core/utils/RateLimiter";
import { SecurityValidator } from "../../../core/utils/SecurityValidator";
import { AppError } from "../../../core/errors/AppErrors";

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
  return ips[ips.length - 1] || req.headers.get("x-real-ip") || "unknown";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const documents = await documentService.getAll(session.user.id);
    return NextResponse.json(documents.map(serializeDocument), { status: 200 });
  } catch (error) {
    console.error("[GET /api/documents]", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatusCode });
    }
    return NextResponse.json({ error: "Failed to retrieve documents." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    uploadRateLimiter.check(getClientIp(req));

    SecurityValidator.validateEnvironment();

    const formData = await req.formData();
    const filesAttr = formData.getAll("files") as File[];
    const fileAttr = formData.get("file") as File | null;
    const rawFilesList = filesAttr.length > 0 ? filesAttr : fileAttr ? [fileAttr] : [];

    if (rawFilesList.length === 0) {
      return NextResponse.json({ error: "No textbook screenshots were uploaded." }, { status: 400 });
    }

    SecurityValidator.validateFiles(
      rawFilesList.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

    const processedFiles: Array<{ fileBuffer: Buffer; originalFilename: string; mimeType: string }> = [];
    for (const file of rawFilesList) {
      if (!file || typeof file.arrayBuffer !== "function") continue;
      const bytes = await file.arrayBuffer();
      processedFiles.push({
        fileBuffer: Buffer.from(bytes),
        originalFilename: file.name || "screenshot.png",
        mimeType: file.type || "image/png",
      });
    }

    if (processedFiles.length === 0) {
      return NextResponse.json({ error: "No valid image files found in upload." }, { status: 400 });
    }

    const documentEntity = await documentService.execute({
      userId: session.user.id,
      files: processedFiles,
    });

    return NextResponse.json(serializeDocument(documentEntity), { status: 201 });
  } catch (error) {
    console.error("[POST /api/documents]", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatusCode });
    }
    const errMsg = (error as Error).message ?? "";
    if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota")) {
      return NextResponse.json(
        { error: "The Caterpillar's hookah is exhausted (Gemini rate limit). Please wait a moment." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Failed to process uploaded screenshot." }, { status: 500 });
  }
}
