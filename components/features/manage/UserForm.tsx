"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createUser,
  updateUser,
  type ManagedUser,
} from "@/app/actions/user-admin";
import { PageHeader } from "@/components/common/PageHeader";

export function UserForm({ user }: { user: ManagedUser | null }) {
  const router = useRouter();
  const [account, setAccount] = useState(user?.account ?? "");
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = user
        ? await updateUser(user.id, {
            account,
            nickname,
            password: password || undefined,
          })
        : await createUser({ account, password, nickname });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/users");
      router.refresh();
    });
  }

  return (
    <div className="min-h-full pb-8">
      <PageHeader
        backHref="/users"
        title={user ? "编辑用户" : "新增用户"}
        right={
          <button
            type="submit"
            form="user-form"
            disabled={pending}
            className="text-sm font-semibold text-brand-deep"
          >
            {pending ? "保存中…" : "保存"}
          </button>
        }
      />

      <form
        id="user-form"
        onSubmit={onSubmit}
        className="space-y-4 px-4 py-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">账号</span>
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            autoComplete="off"
            required
            placeholder="字母或数字"
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">昵称</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            required
            placeholder="显示名称"
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">
            {user ? "新密码（留空则不修改）" : "密码"}
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required={!user}
            placeholder={user ? "至少 6 位，可选" : "至少 6 位"}
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-brand"
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </div>
  );
}
