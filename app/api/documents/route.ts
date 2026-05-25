/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - delivery boundary with robust HTTP middleware logic & constraints)
- Revision Action Taken: Implemented robust API security improvements: added in-memory rate limiting map, strict request payload size validation (5MB max per file, 20MB max batch), and intelligent error surfacing for Gemini rate limits (429).
---
*/

import { NextRequest, NextResponse } from "next/server";
import { documentService, serializeDocument } from "../../../core/di";

// In-Memory Rate Limiter to prevent API abuse and Gemini 429 overloads.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024; // 20MB total limits

/**
 * GET: Retrieve all transcribed documents from stored registry database sorted newest to oldest.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "The Caterpillar is thinking too fast! Please wait a moment before sending more queries." },
        { status: 429 }
      );
    }

    const documents = await documentService.getAll();
    const serialized = documents.map(serializeDocument);
    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to retrieve documents: ${(error as Error).message}` },
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
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "The magical inkwell ran dry. Please wait a moment before distilling more scrolls." },
        { status: 429 }
      );
    }

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
    let totalSizeBytes = 0;

    for (const file of rawFilesList) {
      if (file && typeof file.arrayBuffer === "function") {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: `Scroll "${file.name}" exceeds the 5MB limit. Please provide a smaller portrait.` },
            { status: 400 }
          );
        }
        
        totalSizeBytes += file.size;
        if (totalSizeBytes > MAX_TOTAL_SIZE_BYTES) {
          return NextResponse.json(
            { error: "Total batch exceeds the 20MB limit. The Rabbit Hole cannot fit this many scrolls at once." },
            { status: 400 }
          );
        }

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
    const errMsg = (error as Error).message;
    let userFriendlyMsg = `Failed to process uploaded textbook screenshot: ${errMsg}`;
    
    // Map upstream AI API rate-limit throws to a graceful warning
    if (errMsg.includes("429") || errMsg.includes("Too Many Requests") || errMsg.toLowerCase().includes("quota")) {
      userFriendlyMsg = "The Caterpillar's hookah is exhausted (Gemini Rate Limit). Please wait a moment before requesting more wisdom.";
    }

    return NextResponse.json(
      { error: userFriendlyMsg },
      { status: 500 }
    );
  }
}
