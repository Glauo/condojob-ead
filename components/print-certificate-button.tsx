"use client";

export function PrintCertificateButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary">
      Imprimir certificado
    </button>
  );
}
