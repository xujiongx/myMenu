"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronRight, Pencil, ShoppingBag, User } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { CART_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/constants/branding";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import type { Profile } from "@/lib/types";

export function MineClient({ user }: { user: Profile }) {
  const router = useRouter();
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const [deny, setDeny] = useState(false);
  const [pending, startTransition] = useTransition();

  function onManageClick() {
    if (user.role !== "admin") {
      setDeny(true);
      return;
    }
    router.push("/manage");
  }

  function onConfirmSwitch() {
    startTransition(async () => {
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(CART_STORAGE_KEY);
      await logoutAction();
    });
  }

  return (
    <div className="min-h-dvh pb-8">
      <div className="bg-gradient-to-br from-brand via-[#f6c453] to-[#f59e0b] px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/90 text-xl font-bold text-brand-deep">
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
          <div className="min-w-0 text-[#3b2a00]">
            <h1 className="truncate font-display text-2xl">{user.nickname}</h1>
            <p className="mt-1 text-sm opacity-80">账号 {user.account}</p>
            <p className="mt-0.5 text-xs opacity-70">
              {user.role === "admin" ? "管理员" : "普通用户"}
            </p>
          </div>
        </div>
      </div>

      <div className="-mt-4 mx-4 space-y-3">
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
          <Link
            href="/orders"
            className="flex items-center justify-between px-4 py-4 text-sm active:bg-[#faf7f2]"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag size={ICON_SIZE.md} strokeWidth={1.9} className="text-muted" aria-hidden />
              点菜记录
            </span>
            <ChevronRight size={ICON_SIZE.sm} strokeWidth={2} className="text-muted" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={onManageClick}
            className="flex w-full items-center justify-between border-t border-line px-4 py-4 text-left text-sm active:bg-[#faf7f2]"
          >
            <span className="inline-flex items-center gap-2">
              <Pencil size={ICON_SIZE.md} strokeWidth={1.9} className="text-muted" aria-hidden />
              点菜管理
            </span>
            <ChevronRight size={ICON_SIZE.sm} strokeWidth={2} className="text-muted" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setConfirmSwitch(true)}
            className="flex w-full items-center justify-between border-t border-line px-4 py-4 text-left text-sm active:bg-[#faf7f2]"
          >
            <span className="inline-flex items-center gap-2">
              <User size={ICON_SIZE.md} strokeWidth={1.9} className="text-muted" aria-hidden />
              切换账号
            </span>
            <ChevronRight size={ICON_SIZE.sm} strokeWidth={2} className="text-muted" aria-hidden />
          </button>
        </div>
      </div>

      {confirmSwitch ? (
        <Modal
          title="确定要切换账号吗？"
          onCancel={() => setConfirmSwitch(false)}
          onConfirm={onConfirmSwitch}
          confirmText={pending ? "退出中…" : "确定"}
        />
      ) : null}

      {deny ? (
        <Modal
          title="当前账号无管理权限"
          onCancel={() => setDeny(false)}
          onConfirm={() => setDeny(false)}
          confirmText="知道了"
          hideCancel
        />
      ) : null}
    </div>
  );
}

function Modal({
  title,
  onCancel,
  onConfirm,
  confirmText,
  hideCancel,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText: string;
  hideCancel?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
      <div className="w-full rounded-2xl bg-card p-5 shadow-xl">
        <p className="text-center text-base font-medium">{title}</p>
        <div className={`mt-5 grid gap-3 ${hideCancel ? "" : "grid-cols-2"}`}>
          {!hideCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-line py-2.5 text-sm"
            >
              取消
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-brand py-2.5 text-sm font-semibold text-[#3b2a00]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
