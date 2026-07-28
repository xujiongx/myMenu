"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/app/actions/auth";
import { hashPassword, isValidAccount } from "@/lib/auth/password";
import { ensureDefaultCategories, menuCacheTag } from "@/lib/menu/defaults";
import { createServiceClient } from "@/lib/supabase/service";
import type { Profile, UserRole } from "@/lib/types";

export type ManagedUser = Profile & {
  /** 是否为受保护的管理员账号（不可编辑/删除） */
  protected: boolean;
};

type ProfileRow = {
  id: string;
  account: string;
  nickname: string;
  avatar_url: string | null;
  role: UserRole;
};

function isProtectedAccount(row: Pick<ProfileRow, "account" | "role">): boolean {
  return row.account === "admin" || row.role === "admin";
}

function mapUser(row: ProfileRow): ManagedUser {
  return {
    id: row.id,
    account: row.account,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    role: row.role,
    protected: isProtectedAccount(row),
  };
}

export async function listUsers(): Promise<ManagedUser[]> {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, account, nickname, avatar_url, role")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listUsers", error);
    throw new Error("加载用户失败");
  }

  return ((data ?? []) as ProfileRow[]).map(mapUser);
}

export async function fetchUserById(id: string): Promise<ManagedUser | null> {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, account, nickname, avatar_url, role")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("fetchUserById", error);
    throw new Error("加载用户失败");
  }
  if (!data) return null;
  return mapUser(data as ProfileRow);
}

export async function createUser(input: {
  account: string;
  password: string;
  nickname: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin();

  const account = input.account.trim();
  const nickname = input.nickname.trim();
  const password = input.password;

  if (!account) return { ok: false, error: "请输入账号" };
  if (!isValidAccount(account)) {
    return { ok: false, error: "账号仅支持字母和数字" };
  }
  if (account.toLowerCase() === "admin") {
    return { ok: false, error: "不可使用保留账号名 admin" };
  }
  if (!nickname) return { ok: false, error: "请输入昵称" };
  if (!password || password.length < 6) {
    return { ok: false, error: "密码至少 6 位" };
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("account", account)
    .maybeSingle();
  if (existing) return { ok: false, error: "账号已存在" };

  const password_hash = await hashPassword(password);
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      account,
      password_hash,
      nickname,
      role: "user",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createUser", error);
    return { ok: false, error: "创建用户失败" };
  }

  await ensureDefaultCategories(data.id);
  revalidateTag(menuCacheTag(data.id), "max");
  revalidatePath("/users");
  return { ok: true, id: data.id };
}

export async function updateUser(
  id: string,
  input: {
    account: string;
    nickname: string;
    password?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  const supabase = createServiceClient();
  const { data: row, error: loadError } = await supabase
    .from("profiles")
    .select("id, account, nickname, avatar_url, role")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    console.error("updateUser load", loadError);
    return { ok: false, error: "加载用户失败" };
  }
  if (!row) return { ok: false, error: "用户不存在" };

  const current = row as ProfileRow;
  if (isProtectedAccount(current)) {
    return { ok: false, error: "不可修改管理员账号" };
  }

  const account = input.account.trim();
  const nickname = input.nickname.trim();
  const password = input.password?.trim() ?? "";

  if (!account) return { ok: false, error: "请输入账号" };
  if (!isValidAccount(account)) {
    return { ok: false, error: "账号仅支持字母和数字" };
  }
  if (account.toLowerCase() === "admin") {
    return { ok: false, error: "不可使用保留账号名 admin" };
  }
  if (!nickname) return { ok: false, error: "请输入昵称" };
  if (password && password.length < 6) {
    return { ok: false, error: "密码至少 6 位" };
  }

  if (account !== current.account) {
    const { data: clash } = await supabase
      .from("profiles")
      .select("id")
      .eq("account", account)
      .maybeSingle();
    if (clash) return { ok: false, error: "账号已存在" };
  }

  const patch: Record<string, string> = {
    account,
    nickname,
    updated_at: new Date().toISOString(),
  };
  if (password) {
    patch.password_hash = await hashPassword(password);
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) {
    console.error("updateUser", error);
    return { ok: false, error: "更新用户失败" };
  }

  revalidatePath("/users");
  return { ok: true };
}

export async function deleteUser(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (admin.id === id) {
    return { ok: false, error: "不可删除当前登录账号" };
  }

  const supabase = createServiceClient();
  const { data: row, error: loadError } = await supabase
    .from("profiles")
    .select("id, account, nickname, avatar_url, role")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    console.error("deleteUser load", loadError);
    return { ok: false, error: "加载用户失败" };
  }
  if (!row) return { ok: false, error: "用户不存在" };

  const current = row as ProfileRow;
  if (isProtectedAccount(current)) {
    return { ok: false, error: "不可删除管理员账号" };
  }

  // orders 对 profiles 为 RESTRICT，需先删订单（明细随 CASCADE）
  const { error: orderError } = await supabase
    .from("orders")
    .delete()
    .eq("user_id", id);
  if (orderError) {
    console.error("deleteUser orders", orderError);
    return { ok: false, error: "删除用户订单失败" };
  }

  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) {
    console.error("deleteUser", error);
    return { ok: false, error: "删除用户失败" };
  }

  revalidateTag(menuCacheTag(id), "max");
  revalidatePath("/users");
  return { ok: true };
}
