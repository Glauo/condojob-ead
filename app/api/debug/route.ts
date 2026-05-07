import { NextResponse } from "next/server";
import { db as pool } from "@/lib/db";

export async function GET() {
  try {
    const r = await pool.query("SELECT 1 AS ok, version() AS pg_version");
    return NextResponse.json({ connected: true, row: r.rows[0] });
  } catch (err) {
    return NextResponse.json({ connected: false, error: String(err) });
  }
}
