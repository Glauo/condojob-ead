import { NextRequest, NextResponse } from "next/server";

const CONDOJOB_HOSTS = new Set(["condojobead.com.br", "www.condojobead.com.br"]);

export function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isCondoJobHost = CONDOJOB_HOSTS.has(host);
  const pathname = req.nextUrl.pathname;

  if (process.env.NODE_ENV === "production" && isCondoJobHost && forwardedProto === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/videos/")) {
    return new NextResponse("Video protegido.", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const res = NextResponse.next();

  if (
    pathname.startsWith("/coordenador") ||
    pathname.startsWith("/aluno") ||
    pathname.startsWith("/api/aulas") ||
    pathname.startsWith("/api/atividades")
  ) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
  }

  if (pathname.startsWith("/coordenador/aulas") || pathname.startsWith("/coordenador/cursos")) {
    res.headers.set("Clear-Site-Data", '"cache"');
  }

  if (process.env.NODE_ENV === "production" && isCondoJobHost) {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.headers.set("X-Content-Type-Options", "nosniff");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
