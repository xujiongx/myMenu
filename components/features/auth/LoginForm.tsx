"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UtensilsCrossed } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { APP_DISPLAY_NAME, USER_STORAGE_KEY } from "@/lib/constants/branding";
import { ICON_SIZE } from "@/lib/constants/icon-size";

export function LoginForm() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    account?: string;
    password?: string;
  }>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: { account?: string; password?: string } = {};
    if (!account.trim()) nextErrors.account = "请输入账号";
    if (!password) nextErrors.password = "请输入密码";
    setFieldErrors(nextErrors);
    if (nextErrors.account || nextErrors.password) {
      setError(null);
      return;
    }

    startTransition(async () => {
      const result = await loginAction({ account, password });
      if (!result.ok) {
        setPassword("");
        setError(result.error);
        return;
      }
      if (remember) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-10 pt-16">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand text-[#3b2a00] shadow-[0_10px_30px_rgba(240,180,41,0.45)]">
          <UtensilsCrossed size={ICON_SIZE.logo} strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">
          {APP_DISPLAY_NAME}
        </h1>
        <p className="mt-2 text-sm text-muted">登录后开始点菜</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">账号</span>
          <input
            value={account}
            onChange={(e) =>
              setAccount(e.target.value.replace(/[^A-Za-z0-9]/g, ""))
            }
            placeholder="请输入登录账号"
            autoComplete="username"
            className={`w-full rounded-2xl border bg-card px-4 py-3.5 outline-none transition focus:border-brand ${
              fieldErrors.account ? "border-danger" : "border-line"
            }`}
          />
          {fieldErrors.account ? (
            <span className="mt-1 block text-xs text-danger">
              {fieldErrors.account}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">密码</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入登录密码"
              autoComplete="current-password"
              className={`w-full rounded-2xl border bg-card px-4 py-3.5 pr-16 outline-none transition focus:border-brand ${
                fieldErrors.password ? "border-danger" : "border-line"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted"
            >
              {showPassword ? "隐藏" : "显示"}
            </button>
          </div>
          {fieldErrors.password ? (
            <span className="mt-1 block text-xs text-danger">
              {fieldErrors.password}
            </span>
          ) : null}
        </label>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 accent-brand-deep"
          />
          记住账号
        </label>

        {error ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-2xl bg-brand py-3.5 text-base font-semibold text-[#3b2a00] shadow-[0_8px_20px_rgba(240,180,41,0.35)] transition active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "登录中…" : "登录"}
        </button>
      </form>

      {/* <p className="mt-auto pt-8 text-center text-xs text-muted">
        演示账号 admin / admin123 · user / user123（各自独立菜单）
      </p> */}
    </div>
  );
}
