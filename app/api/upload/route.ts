import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

    const formData = await req.formData();
    const isResposta = formData.has("resposta");
    const file = (formData.get("video") ?? formData.get("arquivo") ?? formData.get("resposta")) as File | null;

    if (session.perfil !== "coordenador" && !isResposta) {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
    }
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

    const originalName = file.name || "";
    const originalExt = originalName.split(".").pop()?.toLowerCase() || "";
    const allowedVideos = isResposta ? [] : ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    const allowedDocs = ["application/pdf", "application/x-pdf"];
    const allowedImages = isResposta ? ["image/jpeg", "image/png", "image/webp"] : [];
    const allAllowed = [...allowedVideos, ...allowedDocs, ...allowedImages];
    const isPdf = allowedDocs.includes(file.type) || (["", "application/octet-stream"].includes(file.type) && originalExt === "pdf");
    const isImage = allowedImages.includes(file.type);

    if (!allAllowed.includes(file.type) && !isPdf && !isImage) {
      const formatos = isResposta ? "PDF, JPG, PNG ou WebP" : "MP4, WebM, OGG ou PDF";
      return NextResponse.json({ error: `Formato nao suportado (${file.type || originalExt}). Use ${formatos}.` }, { status: 400 });
    }

    const maxSize = isResposta || isPdf ? 50 * 1024 * 1024 : 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `Arquivo muito grande. Maximo ${isResposta || isPdf ? "50" : "500"} MB.` }, { status: 400 });
    }

    const ext = isPdf ? "pdf" : (originalExt || (isImage ? file.type.split("/")[1] : "mp4"));
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const folder = isResposta ? "respostas" : isPdf ? "materiais" : "videos";
    const uploadsDir = path.join(process.cwd(), "public", folder);

    await mkdir(uploadsDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/${folder}/${filename}`, nome: file.name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload] erro:", msg);
    return NextResponse.json({ error: `Erro interno: ${msg}` }, { status: 500 });
  }
}
