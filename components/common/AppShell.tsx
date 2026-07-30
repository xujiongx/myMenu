"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User } from "lucide-react";
import { ICON_SIZE } from "@/lib/constants/icon-size";

const tabs = [
  { href: "/", label: "点菜", Icon: ShoppingBag },
  { href: "/mine", label: "我的", Icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideTab =
    pathname.startsWith("/login") ||
    pathname.startsWith("/manage") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/users");
  const isOrderPage = pathname === "/";

  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-transparent">
      <div
        className={[
          "min-h-0 flex-1",
          hideTab
            ? pathname.startsWith("/orders/") && pathname.endsWith("/add")
              ? "overflow-hidden"
              : "overflow-y-auto"
            : isOrderPage
              ? "overflow-hidden pb-[calc(3.75rem+env(safe-area-inset-bottom))]"
              : "overflow-y-auto pb-[calc(3.75rem+env(safe-area-inset-bottom))]",
        ].join(" ")}
      >
        {children}
      </div>
      {!hideTab ? (
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-line bg-card/95 backdrop-blur-md">
          <div className="grid grid-cols-2 px-2 pt-1 pb-[env(safe-area-inset-bottom)]">
            {tabs.map((tab) => {
              const active =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(tab.href);
              const TabIcon = tab.Icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center gap-0.5 py-2 text-xs transition ${
                    active ? "text-brand-deep" : "text-muted"
                  }`}
                >
                  <TabIcon
                    size={ICON_SIZE.tab}
                    strokeWidth={active ? 2.25 : 1.9}
                    aria-hidden
                  />
                  <span className={active ? "font-semibold" : ""}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
