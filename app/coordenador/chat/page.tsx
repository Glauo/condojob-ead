import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ChatPanel, type ChatMessage } from "@/components/chat-panel";

type Thread = {
  aluno_id: string;
  aluno_nome: string;
  aluno_email: string;
  ultima_mensagem: string;
  ultima_em: string;
};

export default async function CoordenadorChatPage({
  searchParams,
}: {
  searchParams: Promise<{ aluno_id?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();
  const params = await searchParams;

  const threads = await dbQuery<Thread>(
    `SELECT DISTINCT ON (cm.aluno_id)
            cm.aluno_id, u.nome AS aluno_nome, u.email AS aluno_email,
            cm.mensagem AS ultima_mensagem, cm.criado_em AS ultima_em
       FROM cj_chat_mensagens cm
       JOIN cj_users u ON u.id = cm.aluno_id
      ORDER BY cm.aluno_id, cm.criado_em DESC`
  );

  const selectedId = params.aluno_id || threads[0]?.aluno_id || "";
  const mensagens = selectedId
    ? await dbQuery<ChatMessage>(
        `SELECT cm.id, cm.aluno_id, cm.coordenador_id, cm.remetente_id,
                u.nome AS remetente_nome, u.perfil AS remetente_perfil,
                cm.mensagem, cm.lida, cm.criado_em
           FROM cj_chat_mensagens cm
           JOIN cj_users u ON u.id = cm.remetente_id
          WHERE cm.aluno_id = $1
          ORDER BY cm.criado_em ASC
          LIMIT 80`,
        [selectedId]
      )
    : [];

  const selected = threads.find((t) => t.aluno_id === selectedId);

  return (
    <AppShell breadcrumb="Chat" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Atendimento</div>
          <h1 className="page-title">Chat com alunos</h1>
          <p className="page-desc">Responda as duvidas enviadas pelo painel do aluno.</p>
        </div>
      </div>

      <div className="content-grid grid-2-1">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Conversas</div>
              <h3 className="section-title">Alunos com mensagens</h3>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {threads.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">Nenhuma mensagem ainda</div>
                <p className="empty-desc">Quando um aluno escrever pelo painel, a conversa aparece aqui.</p>
              </div>
            ) : (
              threads.map((thread) => (
                <a
                  key={thread.aluno_id}
                  href={`/coordenador/chat?aluno_id=${thread.aluno_id}`}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--cj-radius)",
                    border: thread.aluno_id === selectedId ? "1px solid rgba(56,189,248,0.45)" : "1px solid var(--cj-dark-border)",
                    background: thread.aluno_id === selectedId ? "rgba(56,189,248,0.08)" : "var(--cj-dark)",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{thread.aluno_nome}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--cj-text-muted)" }}>{thread.aluno_email}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--cj-text-secondary)", marginTop: "6px" }}>
                    {thread.ultima_mensagem.slice(0, 120)}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {selectedId ? (
          <div>
            {selected && (
              <div style={{ marginBottom: "10px", color: "var(--cj-text-muted)", fontSize: "0.85rem" }}>
                Conversa com <strong style={{ color: "var(--cj-text)" }}>{selected.aluno_nome}</strong>
              </div>
            )}
            <ChatPanel initialMessages={mensagens} currentUserId={session.id} alunoId={selectedId} />
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-title">Selecione uma conversa</div>
                <p className="empty-desc">As mensagens dos alunos ficam disponiveis aqui.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
