"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JobsOpportunityApplyButton({ opportunityId, disabled = false, accepted = false }: { opportunityId: string; disabled?: boolean; accepted?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleApply() {
    setLoading(true);
    setErro("");
    const res = await fetch("/api/jobs/opportunities/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro((data as { error?: string }).error || "Nao foi possivel aceitar a vaga.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="jobs-action-stack">
      <button type="button" className="jobs-btn jobs-btn-primary" onClick={handleApply} disabled={disabled || loading || accepted}>
        {accepted ? "Vaga aceita" : loading ? "Aceitando..." : "Aceitar trabalho"}
      </button>
      {erro ? <div className="jobs-inline-error">{erro}</div> : null}
    </div>
  );
}
