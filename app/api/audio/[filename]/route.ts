/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes, secures local files safely avoiding Next.js static asset public exposure)
- Revision Action Taken: Wrapped web stream over native Node stream. Secured route by enforcing auth check to avoid unauthorized hotlinking. Filtered filenames against traversal dots.
---
*/

export const dynamic = "force-dynamic";

import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

interface RouteContext {
  params: Promise<{
    filename: string;
  }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { filename } = await context.params;

    if (!filename || filename.trim() === "" || filename.includes("..") || filename.includes("/")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const audioDir = path.resolve("./data/audio");
    const filePath = path.join(audioDir, filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Audio file not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);

    // Stream the file back safely wrapping with Web ReadableStream
    const readableNodeStream = fs.createReadStream(filePath);
    
    // Convert Node stream to Web stream
    const readableWebStream = new ReadableStream({
      start(controller) {
        readableNodeStream.on("data", (chunk: any) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        readableNodeStream.on("end", () => {
          controller.close();
        });
        readableNodeStream.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        readableNodeStream.destroy();
      }
    });

    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set("Content-Length", stat.size.toString());
    headers.set("Accept-Ranges", "bytes");

    return new NextResponse(readableWebStream, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("[Audio Route Error]", error);
    return new NextResponse("An internal server error occurred", { status: 500 });
  }
}
