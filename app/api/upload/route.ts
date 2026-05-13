import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.perfil !== "coordenador")
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const formData = await req.formData();
    const file = (formData.get("video") ?? formData.get("arquivo")) as File | null;

    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

    const originalName = file.name || "";
    const originalExt = originalName.split(".").pop()?.toLowerCase() || "";
    const allowedVideos = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    const allowedDocs = ["application/pdf", "application/x-pdf"];
    const allAllowed = [...allowedVideos, ...allowedDocs];
    const isPdf = allowedDocs.includes(file.type) || (["", "application/octet-stream"].includes(file.type) && originalExt === "pdf");

    if (!allAllowed.includes(file.type) && !isPdf)
      return NextResponse.json({ error: `Formato não suportado (${file.type}). Use MP4, WebM, OGG ou PDF.` }, { status: 400 });

    const maxSize = isPdf ? 50 * 1024 * 1024 : 500 * 1024 * 1024;
    if (file.size > maxSize)
      return NextResponse.json({ error: `Arquivo muito grande. Máximo ${isPdf ? "50" : "500"} MB.` }, { status: 400 });

    const ext = isPdf ? "pdf" : (originalExt || "mp4");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const folder = isPdf ? "materiais" : "videos";
    const uploadsDir = path.join(process.cwd(), "public", folder);

    await mkdir(uploadsDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/${folder}/${filename}`, nome: file.name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload] erro:", msg);
    return NextResponse.json({ error: `Erro interno: ${msg}` }, { status: 500 });
  }
}
