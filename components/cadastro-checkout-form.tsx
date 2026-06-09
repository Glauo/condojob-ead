"use client";

import { useState } from "react";

type Curso = {
  id: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number;
  preco: number;
};

type Props = {
  cursos: Curso[];
};

type PagamentoGerado = {
  checkoutUrl: string;
  preferenceId?: string;
  pix?: {
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
    ticketUrl: string;
  } | null;
};

export function CadastroCheckoutForm({ cursos }: Props) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    celular_whatsapp: "",
    cpf: "",
    curso_id: cursos[0]?.id || "",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagamento, setPagamento] = useState<PagamentoGerado | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cursoSelecionado = cursos.find((curso) => curso.id === form.curso_id);

  function upd(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
    setPagamento(null);
  }

  async function copiarPix() {
    const codigo = pagamento?.pix?.qrCode;
    if (!codigo) return;
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2200);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.curso_id) {
      setErro("Preencha nome, e-mail e curso.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/cadastro/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok || !data.checkoutUrl) {
      setErro((data as { error?: string }).error || "Nao foi possivel iniciar o pagamento.");
      return;
    }

    setPagamento(data as PagamentoGerado);
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      <div className="form-group">
        <label className="form-label">Curso</label>
        <select className="form-input login-input" value={form.curso_id} onChange={(e) => upd("curso_id", e.target.value)}>
          {cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>
              {curso.nome} - R$ {Number(curso.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </option>
          ))}
        </select>
        {cursoSelecionado && (
          <div className="form-hint">
            {cursoSelecionado.carga_horaria}h de curso. Liberacao automatica apos pagamento aprovado.
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Nome completo</label>
        <input className="form-input login-input" value={form.nome} onChange={(e) => upd("nome", e.target.value)} placeholder="Seu nome" />
      </div>

      <div className="form-group">
        <label className="form-label">E-mail</label>
        <input className="form-input login-input" type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="seu@email.com" />
        <div className="form-hint">Este e-mail sera o login. A senha temporaria sera enviada apos o pagamento aprovado.</div>
      </div>

      <div className="form-grid" style={{ gap: "12px" }}>
        <div className="form-group">
          <label className="form-label">WhatsApp</label>
          <input className="form-input login-input" value={form.celular_whatsapp} onChange={(e) => upd("celular_whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">CPF</label>
          <input className="form-input login-input" value={form.cpf} onChange={(e) => upd("cpf", e.target.value)} placeholder="000.000.000-00" />
        </div>
      </div>

      {erro && <div className="form-error">{erro}</div>}

      {pagamento && (
        <div className="card" style={{ padding: "16px", background: "rgba(15,23,42,0.72)", borderColor: "rgba(34,211,238,0.35)" }}>
          <div style={{ fontWeight: 800, color: "var(--cj-text)", marginBottom: "6px" }}>Pagamento gerado</div>
          <p style={{ color: "var(--cj-text-secondary)", fontSize: "0.84rem", lineHeight: 1.6, marginBottom: "12px" }}>
            Para evitar travamento do botao dentro do Mercado Pago, voce pode pagar por Pix direto aqui ou abrir o checkout para cartao/parcelamento.
            Quando o pagamento for aprovado, o login e a senha temporaria serao enviados por e-mail e WhatsApp.
          </p>

          {pagamento.pix?.qrCode && (
            <div style={{ display: "grid", gap: "10px", marginBottom: "12px" }}>
              {pagamento.pix.qrCodeBase64 && (
                <img
                  src={`data:image/png;base64,${pagamento.pix.qrCodeBase64}`}
                  alt="QR Code Pix"
                  style={{ width: "150px", height: "150px", borderRadius: "10px", background: "#fff", padding: "8px", justifySelf: "center" }}
                />
              )}
              <button type="button" className="btn btn-secondary" onClick={copiarPix}>
                {copiado ? "Codigo Pix copiado" : "Copiar Pix copia e cola"}
              </button>
              {pagamento.pix.ticketUrl && (
                <a className="btn btn-ghost" href={pagamento.pix.ticketUrl} target="_blank" rel="noopener noreferrer">
                  Abrir Pix no Mercado Pago
                </a>
              )}
            </div>
          )}

          <button type="button" className="login-btn" onClick={() => { window.location.href = pagamento.checkoutUrl; }}>
            Abrir cartao, boleto ou parcelamento
          </button>
        </div>
      )}

      <button className="login-btn" disabled={loading || cursos.length === 0} type="submit">
        {loading ? "Gerando pagamento..." : pagamento ? "Gerar novo pagamento" : "Cadastrar e pagar com Mercado Pago"}
      </button>
    </form>
  );
}
