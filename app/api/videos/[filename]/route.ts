import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { getSession } from "@/lib/auth";
import { dbQueryOne } from "@/lib/db";

type Params = { params: Promise<{ filename: string }> };

const VIDEO_DIR = path.join(process.cwd(), "public", "videos");

function contentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".webm") return "video/webm";
  if (ext === ".ogg" || ext === ".ogv") return "video/ogg";
  if (ext === ".mov") return "video/quicktime";
  return "video/mp4";
}

async function canAccessVideo(filename: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.perfil === "coordenador") return true;

  const videoPath = `/videos/${filename}`;
  const aula = await dbQueryOne(
    `SELECT a.id
       FROM cj_aulas a
       JOIN cj_matriculas m ON m.curso_id = a.curso_id
      WHERE a.video_url = $1
        AND m.usuario_id = $2
        AND m.status IN ('ativo', 'concluido')
      LIMIT 1`,
    [videoPath, session.id]
  );

  return Boolean(aula);
}

async function buildVideoResponse(req: NextRequest, filename: string, includeBody: boolean) {
  if (filename !== path.basename(filename) || !/\.(mp4|webm|ogg|ogv|mov)$/i.test(filename)) {
    return NextResponse.json({ error: "Arquivo invalido." }, { status: 400 });
  }

  if (!(await canAccessVideo(filename))) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const filePath = path.join(VIDEO_DIR, filename);
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Video nao encontrado." }, { status: 404 });
  }

  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Content-Type": contentType(filename),
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });

  const range = req.headers.get("range");
  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (!match) return new NextResponse(null, { status: 416 });

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : fileStat.size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileStat.size) {
      return new NextResponse(null, { status: 416 });
    }

    headers.set("Content-Range", `bytes ${start}-${end}/${fileStat.size}`);
    headers.set("Content-Length", String(end - start + 1));

    const body = includeBody
      ? (Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream)
      : null;
    return new NextResponse(body, { status: 206, headers });
  }

  headers.set("Content-Length", String(fileStat.size));
  const body = includeBody ? (Readable.toWeb(createReadStream(filePath)) as ReadableStream) : null;
  return new NextResponse(body, { status: 200, headers });
}

export async function GET(req: NextRequest, { params }: Params) {
  const { filename } = await params;
  return buildVideoResponse(req, filename, true);
}

export async function HEAD(req: NextRequest, { params }: Params) {
  const { filename } = await params;
  return buildVideoResponse(req, filename, false);
}
