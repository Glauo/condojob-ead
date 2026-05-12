import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let dbOk = false;

  try {
    await db.query("SELECT 1");
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({ ok: true, db: dbOk }, { status: 200 });
}
