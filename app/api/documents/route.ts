import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { documentService, serializeDocument } from "../../../core/di";

// Rate limiter — applies to POST only (Gemini-hitting operations)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_FILE_COUNT = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// Evict expired rate-limit entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS);

function getClientIp(req: NextRequest): string {
  // Take the last segment of X-Forwarded-For (proxy-appended, not client-controlled)
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
  return ips[ips.length - 1] || req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) return false;
  record.count += 1;
  return true;
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
    return NextResponse.json({ error: "Failed to retrieve documents." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "The magical inkwell ran dry. Please wait before distilling more scrolls." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const filesAttr = formData.getAll("files") as File[];
    const fileAttr = formData.get("file") as File | null;
    const rawFilesList = filesAttr.length > 0 ? filesAttr : fileAttr ? [fileAttr] : [];

    if (rawFilesList.length === 0) {
      return NextResponse.json({ error: "No textbook screenshots were uploaded." }, { status: 400 });
    }

    if (rawFilesList.length > MAX_FILE_COUNT) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILE_COUNT} per batch.` },
        { status: 400 }
      );
    }

    const processedFiles: Array<{ fileBuffer: Buffer; originalFilename: string; mimeType: string }> = [];
    let totalSizeBytes = 0;

    for (const file of rawFilesList) {
      if (!file || typeof file.arrayBuffer !== "function") continue;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Scroll "${file.name}" exceeds the 5MB limit.` },
          { status: 400 }
        );
      }

      totalSizeBytes += file.size;
      if (totalSizeBytes > MAX_TOTAL_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Total batch exceeds the 20MB limit." },
          { status: 400 }
        );
      }

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
    const errMsg = (error as Error).message;
    if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota")) {
      return NextResponse.json(
        { error: "The Caterpillar's hookah is exhausted (Gemini rate limit). Please wait a moment." },
        { status: 429 }
      );
    }
    if (errMsg.includes("is not permitted")) {
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process uploaded screenshot." }, { status: 500 });
  }
}
