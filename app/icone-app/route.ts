import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  const file = await readFile(path.join(process.cwd(), "public", "app-icon.svg"), "utf8");
  return new NextResponse(file, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="condojob-educacional-icone.svg"',
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
