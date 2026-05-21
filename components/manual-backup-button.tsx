"use client";

import { useState } from "react";

function arquivoBackup(headers: Headers) {
  const disposition = headers.get("content-disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  return match?.[1] || "condojobead-backup.dump";
}

export function ManualBackupButton() {
  const [loading, setLoading] = useState(false);

  async function baixarBackup() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Nao foi possivel gerar o backup.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = arquivoBackup(res.headers);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nao foi possivel gerar o backup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-ghost" type="button" onClick={baixarBackup} disabled={loading}>
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      {loading ? "Gerando backup..." : "Backup manual"}
    </button>
  );
}
