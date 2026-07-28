"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, isValidAccount, verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  readSession,
  sessionToProfile,
  setSessionCookie,
  signSession,
} from "@/lib/auth/session";
import { menuCacheTag } from "@/lib/menu/defaults";
import { createServiceClient } from "@/lib/supabase/service";
import type { Profile } from "@/lib/types";

type ProfileRow = {
  id: string;
  account: string;
  password_hash: string;
  nickname: string;
  avatar_url: string | null;
  role: "user" | "admin";
};

function mapProfile(row: Omit<ProfileRow, "password_hash">): Profile {
  return {
    id: row.id,
    account: row.account,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    role: row.role,
  };
}

export async function requireUser(): Promise<Profile> {
  const session = await readSession();
  if (!session) {
    throw new Error("请先登录");
  }
  return sessionToProfile(session);
}

export async function requireAdmin(): Promise<Profile> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("无权限");
  }
  return user;
}

export async function getCurrentUserAction(): Promise<Profile | null> {
  const session = await readSession();
  return session ? sessionToProfile(session) : null;
}

export async function loginAction(input: {
  account: string;
  password: string;
}): Promise<{ ok: true; user: Profile } | { ok: false; error: string }> {
  const account = input.account.trim();
  const password = input.password;

  if (!account) return { ok: false, error: "请输入账号" };
  if (!password) return { ok: false, error: "请输入密码" };
  if (!isValidAccount(account)) {
    return { ok: false, error: "账号仅支持字母和数字" };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, account, password_hash, nickname, avatar_url, role")
    .eq("account", account)
    .maybeSingle();

  if (error) {
    console.error("login query failed", error);
    return { ok: false, error: "网络异常，请重试" };
  }

  const row = data as ProfileRow | null;
  if (!row) {
    return { ok: false, error: "账号或密码不正确" };
  }

  const match = await verifyPassword(password, row.password_hash);
  if (!match) {
    return { ok: false, error: "账号或密码不正确" };
  }

  const user = mapProfile(row);
  const token = await signSession(user);
  await setSessionCookie(token);
  revalidateTag(menuCacheTag(user.id), "max");
  revalidatePath("/", "layout");
  return { ok: true, user };
}

export async function logoutAction() {
  const session = await readSession();
  await clearSessionCookie();
  if (session) {
    revalidateTag(menuCacheTag(session.sub), "max");
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

/** 开发辅助：确保种子用户密码可用（幂等） */
export async function ensureSeedPasswordsAction(): Promise<string> {
  const supabase = createServiceClient();
  const seeds = [
    {
      account: "admin",
      password: "admin123",
      nickname: "店长",
      role: "admin" as const,
    },
    {
      account: "user",
      password: "user123",
      nickname: "食客小明",
      role: "user" as const,
    },
  ];

  for (const seed of seeds) {
    const password_hash = await hashPassword(seed.password);
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("account", seed.account)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("profiles")
        .update({
          password_hash,
          role: seed.role,
          updated_at: new Date().toISOString(),
        })
        .eq("account", seed.account);
    } else {
      await supabase.from("profiles").insert({
        account: seed.account,
        password_hash,
        nickname: seed.nickname,
        role: seed.role,
      });
    }
  }

  return "ok";
}
