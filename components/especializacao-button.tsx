"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EspecializacaoButton({ cursoId, preco }: { cursoId: string; preco: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function iniciar() {
    setLoading(true);
    setErro("");
    const res = await fetch("/api/especializacoes/matricular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curso_id: cursoId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErro((data as { error?: string }).error || "Nao foi possivel iniciar a especializacao.");
      return;
    }

    const checkoutUrl = (data as { checkoutUrl?: string }).checkoutUrl;
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <button className="btn btn-primary btn-sm" onClick={iniciar} disabled={loading}>
        {loading ? "Processando..." : Number(preco) > 0 ? "Comprar curso" : "Comecar agora"}
      </button>
      {erro && <span style={{ color: "var(--cj-danger)", fontSize: "0.72rem" }}>{erro}</span>}
    </div>
  );
}
