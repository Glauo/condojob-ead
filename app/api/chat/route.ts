import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";

type ChatRow = {
  id: string;
  aluno_id: string;
  coordenador_id: string | null;
  remetente_id: string;
  remetente_nome: string;
  remetente_perfil: "aluno" | "coordenador";
  mensagem: string;
  lida: boolean;
  criado_em: string;
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  await initSchema();

  const { searchParams } = new URL(req.url);
  const alunoId = session.perfil === "aluno" ? session.id : searchParams.get("aluno_id");

  const params: unknown[] = [];
  let where = "";
  if (alunoId) {
    params.push(alunoId);
    where = "WHERE cm.aluno_id = $1";
  }

  const mensagens = await dbQuery<ChatRow>(
    `SELECT cm.id, cm.aluno_id, cm.coordenador_id, cm.remetente_id,
            u.nome AS remetente_nome, u.perfil AS remetente_perfil,
            cm.mensagem, cm.lida, cm.criado_em
       FROM cj_chat_mensagens cm
       JOIN cj_users u ON u.id = cm.remetente_id
       ${where}
       ORDER BY cm.criado_em DESC
       LIMIT 40`,
    params
  );

  return NextResponse.json(mensagens.reverse());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  await initSchema();

  const { mensagem, aluno_id } = await req.json();
  const texto = String(mensagem || "").trim();
  if (!texto) return NextResponse.json({ error: "Mensagem obrigatoria." }, { status: 400 });

  const alunoId = session.perfil === "aluno" ? session.id : String(aluno_id || "");
  if (!alunoId) return NextResponse.json({ error: "Aluno obrigatorio." }, { status: 400 });

  if (session.perfil === "coordenador") {
    const aluno = await dbQueryOne("SELECT id FROM cj_users WHERE id=$1 AND perfil='aluno'", [alunoId]);
    if (!aluno) return NextResponse.json({ error: "Aluno nao encontrado." }, { status: 404 });
  }

  await dbRun(
    `INSERT INTO cj_chat_mensagens (aluno_id, coordenador_id, remetente_id, mensagem)
     VALUES ($1, $2, $3, $4)`,
    [alunoId, session.perfil === "coordenador" ? session.id : null, session.id, texto]
  );

  const row = await dbQueryOne<ChatRow>(
    `SELECT cm.id, cm.aluno_id, cm.coordenador_id, cm.remetente_id,
            u.nome AS remetente_nome, u.perfil AS remetente_perfil,
            cm.mensagem, cm.lida, cm.criado_em
       FROM cj_chat_mensagens cm
       JOIN cj_users u ON u.id = cm.remetente_id
      WHERE cm.remetente_id=$1
      ORDER BY cm.criado_em DESC
      LIMIT 1`,
    [session.id]
  );

  return NextResponse.json(row, { status: 201 });
}
