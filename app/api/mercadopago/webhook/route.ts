import { NextRequest, NextResponse } from "next/server";
import { initSchema } from "@/lib/db";
import { confirmMercadoPagoPayment } from "@/lib/mercadopago";

function getPaymentId(url: URL, body: unknown) {
  const paramsId = url.searchParams.get("data.id") || url.searchParams.get("id");
  if (paramsId) return paramsId;

  const payload = body as {
    type?: string;
    topic?: string;
    data?: { id?: string | number };
    resource?: string;
  };

  if (payload?.data?.id) return String(payload.data.id);
  if (payload?.topic === "payment" && payload?.resource) {
    return payload.resource.split("/").pop() || "";
  }
  return "";
}

function isPaymentNotification(url: URL, body: unknown) {
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  const payload = body as { type?: string; topic?: string };
  return topic === "payment" || payload?.type === "payment" || payload?.topic === "payment";
}

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const body = await req.json().catch(() => ({}));

    if (!isPaymentNotification(req.nextUrl, body)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const paymentId = getPaymentId(req.nextUrl, body);
    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const result = await confirmMercadoPagoPayment(paymentId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
