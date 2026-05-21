import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun, initSchema } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function nomeArquivo() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `condojobead-backup-${stamp}.dump`;
}

function gerarDump(connectionString: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const dump = spawn(
      "pg_dump",
      ["--dbname", connectionString, "--format=custom", "--no-owner", "--no-privileges"],
      { env: process.env, stdio: ["ignore", "pipe", "pipe"] }
    );
    const chunks: Buffer[] = [];
    const erros: Buffer[] = [];

    dump.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    dump.stderr.on("data", (chunk: Buffer) => erros.push(chunk));
    dump.on("error", () => reject(new Error("Ferramenta de backup indisponivel no servidor.")));
    dump.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
        return;
      }

      const detalhe = Buffer.concat(erros).toString("utf8").trim();
      reject(new Error(detalhe || "Nao foi possivel gerar o backup."));
    });
  });
}

export async function POST() {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const databaseUrl = (process.env.DATABASE_URL || "").replace(/^\uFEFF/, "").trim();
  if (!databaseUrl) {
    return NextResponse.json({ error: "Banco de dados nao configurado." }, { status: 500 });
  }

  try {
    await initSchema();
    const backup = await gerarDump(databaseUrl);
    await dbRun(
      "INSERT INTO cj_logs (usuario_id, acao, detalhes) VALUES ($1, $2, $3)",
      [session.id, "backup_manual_baixado", JSON.stringify({ tamanho_bytes: backup.length })]
    );

    return new NextResponse(new Uint8Array(backup), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${nomeArquivo()}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar backup." },
      { status: 500 }
    );
  }
}
