export const dynamic = "force-dynamic";

import fs from "fs";
import { createReadStream } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { AppError } from "../../../../core/errors/AppErrors";

interface RouteContext {
  params: Promise<{ filename: string }>;
}

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
    const audioDirectory = path.resolve("./data/audio");
    const targetFilePath = path.join(audioDirectory, safeFilename);

    if (!targetFilePath.startsWith(audioDirectory)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!fs.existsSync(targetFilePath)) {
      return NextResponse.json({ error: "Audio file not found." }, { status: 404 });
    }

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
        "Content-Type": "audio/mpeg",
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[GET /api/audio/[filename]]", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatusCode });
    }
    return NextResponse.json({ error: "Failed to serve audio file." }, { status: 500 });
  }
}
