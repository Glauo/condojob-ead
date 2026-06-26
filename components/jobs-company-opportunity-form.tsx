"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL = {
  titulo: "",
  descricao: "",
  tipo_jornada: "freelancer",
  faixa_pagamento: "",
  requisitos: "",
  disponibilidade: "",
  data_servico: "",
  hora_servico: "",
};

export function JobsCompanyOpportunityForm() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function update(field: keyof typeof INITIAL, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/jobs/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro((data as { error?: string }).error || "Nao foi possivel cadastrar a vaga.");
      return;
    }
    setForm(INITIAL);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="jobs-form-grid jobs-inline-form">
      <div className="form-group">
        <label className="form-label">Titulo da vaga</label>
        <input className="form-input" value={form.titulo} onChange={(e) => update("titulo", e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Tipo de jornada</label>
        <select className="form-input" value={form.tipo_jornada} onChange={(e) => update("tipo_jornada", e.target.value)}>
          <option value="freelancer">Freelancer</option>
          <option value="12x36">12x36</option>
          <option value="efetivo">Efetivo</option>
          <option value="temporario">Temporario</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Pagamento</label>
        <input className="form-input" value={form.faixa_pagamento} onChange={(e) => update("faixa_pagamento", e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Data do servico</label>
        <input className="form-input" type="date" value={form.data_servico} onChange={(e) => update("data_servico", e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Horario</label>
        <input className="form-input" type="time" value={form.hora_servico} onChange={(e) => update("hora_servico", e.target.value)} />
      </div>
      <div className="form-group form-group-full">
        <label className="form-label">Disponibilidade e detalhes</label>
        <input className="form-input" value={form.disponibilidade} onChange={(e) => update("disponibilidade", e.target.value)} placeholder="Ex: inicio imediato, plantao noturno, cobertura de ferias" />
      </div>
      <div className="form-group form-group-full">
        <label className="form-label">Descricao</label>
        <textarea className="form-input jobs-textarea" value={form.descricao} onChange={(e) => update("descricao", e.target.value)} />
      </div>
      <div className="form-group form-group-full">
        <label className="form-label">Requisitos</label>
        <textarea className="form-input jobs-textarea" value={form.requisitos} onChange={(e) => update("requisitos", e.target.value)} />
      </div>
      {erro ? <div className="form-error form-group-full">{erro}</div> : null}
      <button type="submit" className="jobs-btn jobs-btn-primary" disabled={loading}>
        {loading ? "Salvando vaga..." : "Cadastrar vaga"}
      </button>
    </form>
  );
}
