"use client";

import { useState } from "react";

export function PaymentButton({ pagamentoId }: { pagamentoId: string }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function pagar() {
    setLoading(true);
    setErro("");
    const res = await fetch("/api/mercadopago/preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagamento_id: pagamentoId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok || !data.checkoutUrl) {
      setErro((data as { error?: string }).error || "Nao foi possivel gerar o link.");
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
      <button className="btn btn-primary btn-sm" onClick={pagar} disabled={loading}>
        {loading ? "Gerando..." : "Pagar"}
      </button>
      {erro && <span style={{ color: "var(--cj-danger)", fontSize: "0.72rem" }}>{erro}</span>}
    </div>
  );
}
