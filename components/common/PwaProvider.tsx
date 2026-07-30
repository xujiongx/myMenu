"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

/**
 * 生产环境注册 Service Worker：预缓存壳层与静态资源，导航时缓存已访问页面。
 * 开发环境关闭，避免 HMR / 缓存干扰。
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
      cacheOnNavigation
      reloadOnOnline
    >
      {children}
    </SerwistProvider>
  );
}
