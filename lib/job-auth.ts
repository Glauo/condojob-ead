import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "condojob-ead-secret-2026"
);
const COOKIE = "cj_jobs_session";

export type JobSession = {
  id: string;
  nome: string;
  email: string;
  perfil: "worker" | "company";
};

export async function signJobSession(payload: JobSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function getJobSession(): Promise<JobSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JobSession;
  } catch {
    return null;
  }
}

export async function setJobSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearJobSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
