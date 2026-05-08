import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador")
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("video") as File | null;

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
  if (!allowedTypes.includes(file.type))
    return NextResponse.json({ error: "Formato não suportado. Use MP4, WebM ou OGG." }, { status: 400 });

  const maxSize = 500 * 1024 * 1024; // 500 MB
  if (file.size > maxSize)
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 500 MB." }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "videos");

  await mkdir(uploadsDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/videos/${filename}` });
}

export const config = {
  api: { bodyParser: false },
};
