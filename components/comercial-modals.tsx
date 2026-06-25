"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type LeadData = {
  id?: string;
  empresa?: string | null;
  nome_contato?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  cargo?: string | null;
  origem?: string | null;
  segmento?: string | null;
  cidade?: string | null;
  tags?: string[] | null;
  score?: number | null;
  valor_potencial?: number | null;
  estagio?: string | null;
  observacoes?: string | null;
  ai_resumo?: string | null;
  proxima_acao_em?: string | null;
};

type TemplateData = {
  id: string;
  nome: string;
  canal: "whatsapp" | "email";
  objetivo: string;
  tom: string;
  assunto: string | null;
  conteudo: string;
  ai_gerado: boolean;
  ativo: boolean;
};

type CampanhaData = {
  id?: string;
  nome?: string | null;
  canal?: "whatsapp" | "email" | null;
  status?: string | null;
  template_id?: string | null;
  filtro_estagio?: string | null;
  filtro_origem?: string | null;
  assunto?: string | null;
  mensagem?: string | null;
  agendado_em?: string | null;
};

const STAGES = ["mensagem_enviada", "novo", "qualificado", "reuniao", "proposta", "negociacao", "ganho", "perdido"];
const STAGE_LABELS: Record<string, string> = {
  mensagem_enviada: "Mensagem enviada",
  novo: "Novo lead",
  qualificado: "Qualificado",
  reuniao: "Reuniao",
  proposta: "Proposta",
  negociacao: "Negociacao",
  ganho: "Fechado",
  perdido: "Perdido",
};

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

function DeleteButton({ url, label, confirmText }: { url: string; label: string; confirmText: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm(confirmText)) return;
    setLoading(true);
    await fetch(url, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={loading}>
      {loading ? "Excluindo..." : label}
    </button>
  );
}

export function LeadStageSelect({ leadId, value }: { leadId: string; value: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onChange(next: string) {
    setLoading(true);
    await fetch("/api/comercial/leads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, estagio: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select className="form-input" value={value} disabled={loading} onChange={(e) => onChange(e.target.value)}>
      {STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage] || stage}</option>)}
    </select>
  );
}

export function CampanhaDisparoButton({ campanhaId }: { campanhaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function disparar() {
    setLoading(true);
    const res = await fetch("/api/comercial/campanhas/disparar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: campanhaId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      alert((data as { error?: string }).error || "Erro ao disparar campanha.");
      return;
    }
    alert(`Disparo concluido. Enviados: ${data.enviados}. Rascunhos: ${data.rascunhos}. Erros: ${data.erros}.`);
    router.refresh();
  }

  return (
    <button className="btn btn-primary btn-sm" onClick={disparar} disabled={loading}>
      {loading ? "Disparando..." : "Disparar"}
    </button>
  );
}

export function CampanhaAutoButton({
  campanhaId,
  enabled,
}: {
  campanhaId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleAuto() {
    setLoading(true);
    const res = await fetch("/api/comercial/campanhas/agendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: campanhaId, enabled: !enabled }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert((data as { error?: string }).error || "Erro ao alterar automacao.");
      return;
    }

    router.refresh();
  }

  return (
    <button className="btn btn-secondary btn-sm" onClick={toggleAuto} disabled={loading}>
      {loading ? "Salvando..." : enabled ? "Pausar auto" : "Ativar auto"}
    </button>
  );
}

export function LeadImportModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<null | {
    totalRecebidos: number;
    totalValidos: number;
    inseridos: number;
    duplicados: number;
  }>(null);

  async function importar() {
    if (!arquivo) {
      setErro("Selecione um arquivo.");
      return;
    }

    setSending(true);
    setErro("");
    setResultado(null);
    const form = new FormData();
    form.append("file", arquivo);

    const res = await fetch("/api/comercial/leads/import", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setErro((data as { error?: string }).error || "Erro ao importar leads.");
      return;
    }

    setResultado(data as { totalRecebidos: number; totalValidos: number; inseridos: number; duplicados: number });
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-secondary" onClick={() => setOpen(true)}>
        Importar leads
      </button>
      {open && (
        <ModalPortal>
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="modal-box commercial-modal" style={{ maxWidth: "760px" }}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Importar leads</div>
                  <div className="modal-subtitle">Envie Excel, Word, PDF textual ou TXT para cadastro automatico.</div>
                </div>
                <button className="modal-close" onClick={() => setOpen(false)}>x</button>
              </div>
              <div className="modal-body commercial-modal-body">
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label className="form-label">Arquivo</label>
                    <input
                      className="form-input"
                      type="file"
                      accept=".xlsx,.xls,.csv,.docx,.pdf,.txt"
                      onChange={(e) => {
                        setArquivo(e.target.files?.[0] || null);
                        setErro("");
                        setResultado(null);
                      }}
                    />
                    <div className="form-hint">
                      Duplicados por nome ou celular sao ignorados. PDF precisa ser textual, nao escaneado.
                    </div>
                  </div>
                </div>
                {resultado && (
                  <div className="card" style={{ marginTop: "14px" }}>
                    <div className="card-body" style={{ display: "grid", gap: "8px" }}>
                      <div className="table-name-primary">Importacao concluida</div>
                      <div className="table-name-secondary">Linhas lidas: {resultado.totalRecebidos}</div>
                      <div className="table-name-secondary">Leads validos: {resultado.totalValidos}</div>
                      <div className="table-name-secondary">Inseridos: {resultado.inseridos}</div>
                      <div className="table-name-secondary">Duplicados ignorados: {resultado.duplicados}</div>
                    </div>
                  </div>
                )}
                {erro && <div className="form-error" style={{ marginTop: "12px" }}>{erro}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={sending}>Fechar</button>
                <button className="btn btn-primary" onClick={importar} disabled={sending}>
                  {sending ? "Importando..." : "Importar arquivo"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

export function LeadWhatsAppButton({ lead }: { lead: LeadData }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [mensagem, setMensagem] = useState(
    `Ola, {{nome_contato}}. Sou da CondoJob Educacional. Estou entrando em contato para apresentar nossa formacao profissional para equipes condominiais. Posso te enviar um resumo rapido?`
  );

  async function enviar() {
    if (!lead.id) {
      setErro("Lead sem identificacao.");
      return;
    }
    if (!String(lead.whatsapp || "").trim()) {
      setErro("Essa lead nao possui WhatsApp cadastrado.");
      return;
    }
    if (!mensagem.trim()) {
      setErro("Informe a mensagem.");
      return;
    }

    setSending(true);
    setErro("");
    setInfo("");
    const res = await fetch("/api/comercial/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        mensagem,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setErro((data as { error?: string }).error || "Erro ao preparar envio por WhatsApp.");
      return;
    }

    const payload = data as { status?: string; warning?: string | null; whatsappUrl?: string };
    if (payload.whatsappUrl && payload.status === "rascunho") {
      window.open(payload.whatsappUrl, "_blank", "noopener,noreferrer");
    }

    setInfo(
      payload.warning ||
      (payload.status === "enviado"
        ? "Mensagem enviada pelo sistema."
        : "Mensagem pronta no WhatsApp Web.")
    );
  }

  return (
    <>
      <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        WhatsApp
      </button>
      {open && (
        <ModalPortal>
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="modal-box commercial-modal" style={{ maxWidth: "720px" }}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Enviar WhatsApp</div>
                  <div className="modal-subtitle">{lead.empresa || "Lead"} | {lead.nome_contato || "Contato"}</div>
                </div>
                <button className="modal-close" onClick={() => setOpen(false)}>x</button>
              </div>
              <div className="modal-body commercial-modal-body">
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label className="form-label">Numero</label>
                    <input className="form-input" value={String(lead.whatsapp || "")} disabled />
                  </div>
                  <div className="form-group form-group-full">
                    <label className="form-label">Mensagem</label>
                    <textarea
                      className="form-input form-textarea"
                      rows={8}
                      value={mensagem}
                      onChange={(e) => {
                        setMensagem(e.target.value);
                        setErro("");
                        setInfo("");
                      }}
                    />
                    <div className="form-hint">
                      Variaveis aceitas: {`{{nome_contato}}`} e {`{{empresa}}`}.
                    </div>
                  </div>
                </div>
                {info && <div className="form-hint" style={{ marginTop: "12px" }}>{info}</div>}
                {erro && <div className="form-error" style={{ marginTop: "12px" }}>{erro}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={sending}>Fechar</button>
                <button className="btn btn-primary" onClick={enviar} disabled={sending}>
                  {sending ? "Enviando..." : "Enviar WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

export function LeadModal({ lead }: { lead?: LeadData }) {
  const router = useRouter();
  const isEdit = Boolean(lead?.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    empresa: String(lead?.empresa || ""),
    nome_contato: String(lead?.nome_contato || ""),
    email: String(lead?.email || ""),
    whatsapp: String(lead?.whatsapp || ""),
    cargo: String(lead?.cargo || ""),
    origem: String(lead?.origem || "site"),
    segmento: String(lead?.segmento || ""),
    cidade: String(lead?.cidade || ""),
    tags: Array.isArray(lead?.tags) ? lead?.tags.join(", ") : "",
    score: String(lead?.score ?? 50),
    valor_potencial: String(lead?.valor_potencial ?? 0),
    estagio: String(lead?.estagio || "novo"),
    observacoes: String(lead?.observacoes || ""),
    ai_resumo: String(lead?.ai_resumo || ""),
    proxima_acao_em: String(lead?.proxima_acao_em || ""),
  });

  function upd(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  async function salvar() {
    if (!form.empresa.trim() || !form.nome_contato.trim()) {
      setErro("Empresa e contato sao obrigatorios.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/comercial/leads", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead?.id, ...form }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro((data as { error?: string }).error || "Erro ao salvar lead.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className={isEdit ? "btn btn-ghost btn-sm" : "btn btn-primary"} onClick={() => setOpen(true)}>
        {isEdit ? "Editar" : "+ Nova lead"}
      </button>
      {open && (
        <ModalPortal>
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="modal-box commercial-modal" style={{ maxWidth: "760px" }}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{isEdit ? "Editar lead" : "Nova lead"}</div>
                  <div className="modal-subtitle">Cadastro comercial completo</div>
                </div>
                <button className="modal-close" onClick={() => setOpen(false)}>x</button>
              </div>
              <div className="modal-body commercial-modal-body">
                <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Empresa *</label>
                  <input className="form-input" value={form.empresa} onChange={(e) => upd("empresa", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contato *</label>
                  <input className="form-input" value={form.nome_contato} onChange={(e) => upd("nome_contato", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-input" value={form.email} onChange={(e) => upd("email", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp</label>
                  <input className="form-input" value={form.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo</label>
                  <input className="form-input" value={form.cargo} onChange={(e) => upd("cargo", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Origem</label>
                  <input className="form-input" value={form.origem} onChange={(e) => upd("origem", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Segmento</label>
                  <input className="form-input" value={form.segmento} onChange={(e) => upd("segmento", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input className="form-input" value={form.cidade} onChange={(e) => upd("cidade", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Score</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.score} onChange={(e) => upd("score", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor potencial</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.valor_potencial} onChange={(e) => upd("valor_potencial", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estagio</label>
                  <select className="form-input" value={form.estagio} onChange={(e) => upd("estagio", e.target.value)}>
                    {STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage] || stage}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Proxima acao</label>
                  <input className="form-input" type="datetime-local" value={form.proxima_acao_em} onChange={(e) => upd("proxima_acao_em", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Tags</label>
                  <input className="form-input" value={form.tags} onChange={(e) => upd("tags", e.target.value)} placeholder="premium, administradora, portaria" />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Resumo IA</label>
                  <textarea className="form-input form-textarea" rows={3} value={form.ai_resumo} onChange={(e) => upd("ai_resumo", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Observacoes</label>
                  <textarea className="form-input form-textarea" rows={4} value={form.observacoes} onChange={(e) => upd("observacoes", e.target.value)} />
                </div>
                </div>
                {erro && <div className="form-error" style={{ marginTop: "12px" }}>{erro}</div>}
              </div>
              <div className="modal-footer">
                {lead?.id && <DeleteButton url={`/api/comercial/leads?id=${lead.id}`} label="Excluir" confirmText={`Excluir a lead ${lead.empresa}?`} />}
                <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
                <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar lead"}</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

export function TemplateModal({ template }: { template?: TemplateData }) {
  const router = useRouter();
  const isEdit = Boolean(template?.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [erro, setErro] = useState("");
  const [iaInfo, setIaInfo] = useState("");
  const [form, setForm] = useState({
    nome: String(template?.nome || ""),
    canal: String(template?.canal || "whatsapp"),
    objetivo: String(template?.objetivo || "prospeccao"),
    tom: String(template?.tom || "consultivo"),
    assunto: String(template?.assunto || ""),
    conteudo: String(template?.conteudo || ""),
    ai_gerado: Boolean(template?.ai_gerado),
    ativo: template?.ativo !== false,
  });

  function upd<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  async function gerarComIA() {
    setGenerating(true);
    setErro("");
    setIaInfo("");
    const res = await fetch("/api/comercial/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canal: form.canal,
        objetivo: form.objetivo,
        tom: form.tom,
        assunto: form.assunto,
        empresa: "condominio premium",
        nomeContato: "responsavel",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setGenerating(false);
    if (!res.ok) {
      setErro((data as { error?: string }).error || "Erro ao gerar copy.");
      return;
    }
    const payload = data as { assunto?: string; mensagem?: string; warning?: string; source?: string };
    upd("assunto", payload.assunto || "");
    upd("conteudo", payload.mensagem || "");
    upd("ai_gerado", true);
    setIaInfo(
      payload.warning
        ? payload.warning
        : payload.source === "openai"
          ? "Copy gerada com OpenAI."
          : "Copy gerada pelo modelo interno."
    );
  }

  async function salvar() {
    if (!form.nome.trim() || !form.conteudo.trim()) {
      setErro("Nome e conteudo sao obrigatorios.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/comercial/templates", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: template?.id, ...form }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro((data as { error?: string }).error || "Erro ao salvar template.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className={isEdit ? "btn btn-ghost btn-sm" : "btn btn-secondary"} onClick={() => setOpen(true)}>
        {isEdit ? "Editar" : "+ Novo template"}
      </button>
      {open && (
        <ModalPortal>
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="modal-box commercial-modal" style={{ maxWidth: "760px" }}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{isEdit ? "Editar template" : "Novo template IA"}</div>
                  <div className="modal-subtitle">Mensagens comerciais otimizadas</div>
                </div>
                <button className="modal-close" onClick={() => setOpen(false)}>x</button>
              </div>
              <div className="modal-body commercial-modal-body">
                <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input className="form-input" value={form.nome} onChange={(e) => upd("nome", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Canal</label>
                  <select className="form-input" value={form.canal} onChange={(e) => upd("canal", e.target.value)}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Objetivo</label>
                  <select className="form-input" value={form.objetivo} onChange={(e) => upd("objetivo", e.target.value)}>
                    <option value="prospeccao">Prospeccao</option>
                    <option value="followup">Follow-up</option>
                    <option value="reativacao">Reativacao</option>
                    <option value="fechamento">Fechamento</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tom</label>
                  <select className="form-input" value={form.tom} onChange={(e) => upd("tom", e.target.value)}>
                    <option value="consultivo">Consultivo</option>
                    <option value="direto">Direto</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Assunto</label>
                  <input className="form-input" value={form.assunto} onChange={(e) => upd("assunto", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Mensagem</label>
                  <textarea className="form-input form-textarea" rows={8} value={form.conteudo} onChange={(e) => upd("conteudo", e.target.value)} />
                  <div style={{ marginTop: "10px" }}>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={gerarComIA} disabled={generating}>
                      {generating ? "Gerando..." : "Gerar copy com IA"}
                    </button>
                  </div>
                </div>
                </div>
                {iaInfo && <div className="form-hint" style={{ marginTop: "12px" }}>{iaInfo}</div>}
                {erro && <div className="form-error" style={{ marginTop: "12px" }}>{erro}</div>}
              </div>
              <div className="modal-footer">
                {template?.id && <DeleteButton url={`/api/comercial/templates?id=${template.id}`} label="Excluir" confirmText={`Excluir o template ${template.nome}?`} />}
                <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
                <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar template"}</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

export function CampanhaModal({
  campanha,
  templates,
}: {
  campanha?: CampanhaData;
  templates: TemplateData[];
}) {
  const router = useRouter();
  const isEdit = Boolean(campanha?.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    nome: String(campanha?.nome || ""),
    canal: String(campanha?.canal || "whatsapp"),
    status: String(campanha?.status || "rascunho"),
    template_id: String(campanha?.template_id || ""),
    filtro_estagio: String(campanha?.filtro_estagio || ""),
    filtro_origem: String(campanha?.filtro_origem || ""),
    assunto: String(campanha?.assunto || ""),
    mensagem: String(campanha?.mensagem || ""),
    agendado_em: String(campanha?.agendado_em || ""),
  });

  function upd(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  function applyTemplate(id: string) {
    upd("template_id", id);
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    upd("canal", template.canal);
    if (!form.assunto.trim()) upd("assunto", template.assunto || "");
    if (!form.mensagem.trim()) upd("mensagem", template.conteudo);
  }

  async function salvar() {
    if (!form.nome.trim() || !form.mensagem.trim()) {
      setErro("Nome e mensagem sao obrigatorios.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/comercial/campanhas", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: campanha?.id,
        ...form,
        template_id: form.template_id || null,
        filtro_estagio: form.filtro_estagio || null,
        filtro_origem: form.filtro_origem || null,
        agendado_em: form.agendado_em || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro((data as { error?: string }).error || "Erro ao salvar campanha.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className={isEdit ? "btn btn-ghost btn-sm" : "btn btn-primary"} onClick={() => setOpen(true)}>
        {isEdit ? "Editar" : "+ Nova campanha"}
      </button>
      {open && (
        <ModalPortal>
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="modal-box commercial-modal" style={{ maxWidth: "760px" }}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{isEdit ? "Editar campanha" : "Nova campanha"}</div>
                  <div className="modal-subtitle">Email e WhatsApp em massa com filtro por funil</div>
                </div>
                <button className="modal-close" onClick={() => setOpen(false)}>x</button>
              </div>
              <div className="modal-body commercial-modal-body">
                <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input className="form-input" value={form.nome} onChange={(e) => upd("nome", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Canal</label>
                  <select className="form-input" value={form.canal} onChange={(e) => upd("canal", e.target.value)}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Template base</label>
                  <select className="form-input" value={form.template_id} onChange={(e) => applyTemplate(e.target.value)}>
                    <option value="">Sem template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>{template.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Filtro por estagio</label>
                  <select className="form-input" value={form.filtro_estagio} onChange={(e) => upd("filtro_estagio", e.target.value)}>
                    <option value="">Todos</option>
                    {STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage] || stage}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Filtro por origem</label>
                  <input className="form-input" value={form.filtro_origem} onChange={(e) => upd("filtro_origem", e.target.value)} placeholder="site, indicacao, evento" />
                </div>
                <div className="form-group">
                  <label className="form-label">Agendamento</label>
                  <input className="form-input" type="datetime-local" value={form.agendado_em} onChange={(e) => upd("agendado_em", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Assunto</label>
                  <input className="form-input" value={form.assunto} onChange={(e) => upd("assunto", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Mensagem</label>
                  <textarea className="form-input form-textarea" rows={8} value={form.mensagem} onChange={(e) => upd("mensagem", e.target.value)} />
                </div>
                </div>
                {erro && <div className="form-error" style={{ marginTop: "12px" }}>{erro}</div>}
              </div>
              <div className="modal-footer">
                {campanha?.id && <DeleteButton url={`/api/comercial/campanhas?id=${campanha.id}`} label="Excluir" confirmText={`Excluir a campanha ${campanha.nome}?`} />}
                <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
                <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar campanha"}</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
