import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants/branding";
import type { Profile, UserRole } from "@/lib/types";

export type SessionPayload = {
  sub: string;
  account: string;
  nickname: string;
  avatarUrl: string | null;
  role: UserRole;
};

function getSecret() {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!secret) {
    throw new Error("缺少 SESSION_SECRET（或可用的服务端密钥）用于签发会话");
  }
  return new TextEncoder().encode(secret.slice(0, 64));
}

export async function signSession(profile: Profile): Promise<string> {
  return new SignJWT({
    account: profile.account,
    nickname: profile.nickname,
    avatarUrl: profile.avatarUrl,
    role: profile.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profile.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.account !== "string") return null;
    return {
      sub: payload.sub,
      account: payload.account,
      nickname: String(payload.nickname ?? payload.account),
      avatarUrl:
        typeof payload.avatarUrl === "string" ? payload.avatarUrl : null,
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionToProfile(session: SessionPayload): Profile {
  return {
    id: session.sub,
    account: session.account,
    nickname: session.nickname,
    avatarUrl: session.avatarUrl,
    role: session.role,
  };
}
