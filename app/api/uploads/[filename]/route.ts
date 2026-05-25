import fs from "fs";
import { createReadStream } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

interface RouteContext {
  params: Promise<{ filename: string }>;
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { filename } = await context.params;
    if (!filename || filename.trim() === "") {
      return NextResponse.json({ error: "Filename parameter is required." }, { status: 400 });
    }

    const safeFilename = path.basename(filename);
    const uploadDirectory = path.resolve("./data/uploads");
    const targetFilePath = path.join(uploadDirectory, safeFilename);

    if (!targetFilePath.startsWith(uploadDirectory)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!fs.existsSync(targetFilePath)) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const ext = path.extname(safeFilename).replace(".", "").toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    const fileStats = fs.statSync(targetFilePath);
    const stream = createReadStream(targetFilePath);
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[GET /api/uploads/[filename]]", error);
    return NextResponse.json({ error: "Failed to serve file." }, { status: 500 });
  }
}
