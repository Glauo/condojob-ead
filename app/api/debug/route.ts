import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.DATABASE_URL ?? "(undefined)";
  const masked = raw.length > 20 ? raw.substring(0, 30) + "..." : raw;

  try {
    const { Pool } = await import("pg");
    const connectionString = raw
      .replace(/[?&]sslmode=[^&]*/g, "")
      .replace(/[?&]channel_binding=[^&]*/g, "")
      .replace(/\?$/, "");

    const pool = new Pool({
      connectionString,
      ssl: raw.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
    });
    const r = await pool.query("SELECT 1 AS ok");
    await pool.end();
    return NextResponse.json({ connected: true, url_preview: masked, url_length: raw.length });
  } catch (err) {
    return NextResponse.json({ connected: false, url_preview: masked, url_length: raw.length, error: String(err) });
  }
}
