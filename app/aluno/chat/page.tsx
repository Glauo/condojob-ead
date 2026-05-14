import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ChatPanel, type ChatMessage } from "@/components/chat-panel";

export default async function AlunoChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const mensagens = await dbQuery<ChatMessage>(
    `SELECT cm.id, cm.aluno_id, cm.coordenador_id, cm.remetente_id,
            u.nome AS remetente_nome, u.perfil AS remetente_perfil,
            cm.mensagem, cm.lida, cm.criado_em
       FROM cj_chat_mensagens cm
       JOIN cj_users u ON u.id = cm.remetente_id
      WHERE cm.aluno_id = $1
      ORDER BY cm.criado_em ASC
      LIMIT 80`,
    [session.id]
  );

  return (
    <AppShell breadcrumb="Chat" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Atendimento</div>
          <h1 className="page-title">Chat com o coordenador</h1>
          <p className="page-desc">Suas mensagens ficam visiveis apenas para voce e para a coordenacao.</p>
        </div>
      </div>

      <div style={{ maxWidth: "760px" }}>
        <ChatPanel initialMessages={mensagens} currentUserId={session.id} alunoId={session.id} />
      </div>
    </AppShell>
  );
}
