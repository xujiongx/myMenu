"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteUser, type ManagedUser } from "@/app/actions/user-admin";
import { BackLink } from "@/components/common/BackLink";
import { ICON_SIZE } from "@/lib/constants/icon-size";

export function UsersManageClient({ users: initial }: { users: ManagedUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteUser(id);
      setConfirmId(null);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setMessage("已删除");
      router.refresh();
    });
  }

  return (
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[#fffaf2]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-3">
          <BackLink href="/mine" />
          <h1 className="font-display text-xl">用户管理</h1>
        </div>
      </header>

      <div className="space-y-3 px-4 py-4">
        {users.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-sm text-muted">
            暂无用户
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-line bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{user.nickname}</h3>
                    {user.role === "admin" ? (
                      <span className="rounded-full bg-brand/25 px-2 py-0.5 text-[10px] text-[#3b2a00]">
                        管理员
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted">账号 {user.account}</p>
                  {user.protected ? (
                    <p className="mt-1 text-xs text-muted">系统管理员，不可编辑或删除</p>
                  ) : null}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0e9df] text-sm font-semibold text-brand-deep">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.nickname.slice(0, 1)
                  )}
                </div>
              </div>
              {!user.protected ? (
                <div className="mt-3 flex gap-4 text-sm">
                  <Link
                    href={`/users/form?id=${user.id}`}
                    className="inline-flex items-center gap-1 text-brand-deep"
                  >
                    <Pencil size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
                    编辑
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-danger"
                    onClick={() => setConfirmId(user.id)}
                  >
                    <Trash2 size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
                    删除
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-line bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Link
          href="/users/form"
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-brand py-3 text-center font-semibold text-[#3b2a00]"
        >
          <Plus size={ICON_SIZE.md} strokeWidth={2.25} aria-hidden />
          新增用户
        </Link>
      </div>

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-card p-5">
            <p className="text-center">确定删除该用户吗？其菜单与订单也会一并删除。</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="rounded-xl border border-line py-2.5"
              >
                取消
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onDelete(confirmId)}
                className="rounded-xl bg-danger py-2.5 text-white"
              >
                {pending ? "删除中…" : "删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {message ? (
        <button
          type="button"
          className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-[#2b2118]/90 px-4 py-2 text-sm text-white"
          onClick={() => setMessage(null)}
        >
          {message}
        </button>
      ) : null}
    </div>
  );
}
