"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BarChart3,
  ChevronRight,
  FolderTree,
  Pencil,
  ShoppingBag,
  User,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { CART_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/constants/branding";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import type { Profile } from "@/lib/types";

export function MineClient({ user }: { user: Profile }) {
  const router = useRouter();
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirmSwitch() {
    startTransition(async () => {
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(CART_STORAGE_KEY);
      await logoutAction();
    });
  }

  return (
    <div className="min-h-full pb-8">
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
          </div>
        </div>
      </div>

      <div className="-mt-4 mx-4 space-y-3">
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
          <Link
            href="/orders"
            className="flex items-center justify-between px-4 py-4 text-sm active:bg-[#faf7f2]"
            data-no-tap
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag
                size={ICON_SIZE.md}
                strokeWidth={1.9}
                className="text-muted"
                aria-hidden
              />
              点菜记录
            </span>
            <ChevronRight
              size={ICON_SIZE.sm}
              strokeWidth={2}
              className="text-muted"
              aria-hidden
            />
          </Link>
          <Link
            href="/stats"
            className="flex items-center justify-between border-t border-line px-4 py-4 text-sm active:bg-[#faf7f2]"
            data-no-tap
          >
            <span className="inline-flex items-center gap-2">
              <BarChart3
                size={ICON_SIZE.md}
                strokeWidth={1.9}
                className="text-muted"
                aria-hidden
              />
              数据统计
            </span>
            <ChevronRight
              size={ICON_SIZE.sm}
              strokeWidth={2}
              className="text-muted"
              aria-hidden
            />
          </Link>
          <button
            type="button"
            onClick={() => router.push("/categories")}
            className="flex w-full items-center justify-between border-t border-line px-4 py-4 text-left text-sm active:bg-[#faf7f2]"
            data-no-tap
          >
            <span className="inline-flex items-center gap-2">
              <FolderTree
                size={ICON_SIZE.md}
                strokeWidth={1.9}
                className="text-muted"
                aria-hidden
              />
              分类管理
            </span>
            <ChevronRight
              size={ICON_SIZE.sm}
              strokeWidth={2}
              className="text-muted"
              aria-hidden
            />
          </button>
          <button
            type="button"
            onClick={() => router.push("/manage")}
            className="flex w-full items-center justify-between border-t border-line px-4 py-4 text-left text-sm active:bg-[#faf7f2]"
            data-no-tap
          >
            <span className="inline-flex items-center gap-2">
              <Pencil
                size={ICON_SIZE.md}
                strokeWidth={1.9}
                className="text-muted"
                aria-hidden
              />
              我的菜单
            </span>
            <ChevronRight
              size={ICON_SIZE.sm}
              strokeWidth={2}
              className="text-muted"
              aria-hidden
            />
          </button>
          {user.role === "admin" ? (
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="flex w-full items-center justify-between border-t border-line px-4 py-4 text-left text-sm active:bg-[#faf7f2]"
              data-no-tap
            >
              <span className="inline-flex items-center gap-2">
                <Users
                  size={ICON_SIZE.md}
                  strokeWidth={1.9}
                  className="text-muted"
                  aria-hidden
                />
                用户管理
              </span>
              <ChevronRight
                size={ICON_SIZE.sm}
                strokeWidth={2}
                className="text-muted"
                aria-hidden
              />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setConfirmSwitch(true)}
            className="flex w-full items-center justify-between border-t border-line px-4 py-4 text-left text-sm active:bg-[#faf7f2]"
            data-no-tap
          >
            <span className="inline-flex items-center gap-2">
              <User
                size={ICON_SIZE.md}
                strokeWidth={1.9}
                className="text-muted"
                aria-hidden
              />
              切换账号
            </span>
            <ChevronRight
              size={ICON_SIZE.sm}
              strokeWidth={2}
              className="text-muted"
              aria-hidden
            />
          </button>
        </div>
      </div>

      {confirmSwitch ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-card p-5 shadow-xl">
            <p className="text-center text-base font-medium">
              确定要切换账号吗？
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmSwitch(false)}
                className="rounded-xl border border-line py-2.5 text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirmSwitch}
                className="rounded-xl bg-brand py-2.5 text-sm font-semibold text-[#3b2a00] tap-primary"
              >
                {pending ? "退出中…" : "确定"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
