import Link from "next/link";
import { initSchema } from "@/lib/db";
import { confirmMercadoPagoPayment } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PagamentoRetornoPage({ searchParams }: Props) {
  await initSchema();
  const params = await searchParams;
  const paymentId = first(params.payment_id) || first(params.collection_id);
  const statusParam = first(params.status) || "pending";

  let localStatus = statusParam === "success" ? "pago" : "pendente";
  let error = "";

  if (paymentId) {
    try {
      const result = await confirmMercadoPagoPayment(paymentId);
      localStatus = result.localStatus;
    } catch (e) {
      error = (e as Error).message || "Nao foi possivel confirmar o pagamento agora.";
    }
  } else if (statusParam === "failure") {
    localStatus = "cancelado";
  }

  const approved = localStatus === "pago";
  const cancelled = localStatus === "cancelado";

  return (
    <div className="login-page">
      <div className="login-right" style={{ width: "100%", minHeight: "100vh" }}>
        <div className="login-right-orb login-right-orb-1" />
        <div className="login-right-orb login-right-orb-2" />
        <div className="login-card" style={{ maxWidth: "460px" }}>
          <div className="card" style={{ padding: "28px", textAlign: "center" }}>
            <div className={`badge ${approved ? "badge-success" : cancelled ? "badge-danger" : "badge-warning"}`} style={{ marginBottom: "16px" }}>
              {approved ? "Pagamento aprovado" : cancelled ? "Pagamento nao aprovado" : "Pagamento em analise"}
            </div>
            <h1 className="page-title">
              {approved ? "Seu acesso foi liberado" : cancelled ? "Nao conseguimos confirmar o pagamento" : "Estamos aguardando a confirmacao"}
            </h1>
            <p className="page-desc" style={{ marginTop: "10px", lineHeight: 1.7 }}>
              {approved
                ? "Agora voce pode entrar com o e-mail e a senha cadastrados para acessar o curso."
                : cancelled
                  ? "Se a cobranca foi recusada, tente novamente pelo link de cadastro ou fale com a coordenacao."
                  : "Assim que o Mercado Pago confirmar, sua matricula sera liberada automaticamente."}
            </p>
            {error && <div className="form-error" style={{ marginTop: "18px", textAlign: "left" }}>{error}</div>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" }}>
              <Link href="/login" className="btn btn-primary">Ir para login</Link>
              {!approved && <Link href="/cadastro" className="btn btn-ghost">Tentar novamente</Link>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
