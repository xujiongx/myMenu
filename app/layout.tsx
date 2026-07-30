import type { Metadata, Viewport } from "next";
import { Manrope, ZCOOL_XiaoWei } from "next/font/google";
import { AppShell } from "@/components/common/AppShell";
import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APP_ICON_PATH,
  APP_SHORT_NAME,
} from "@/lib/constants/branding";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-app-sans",
});

const display = ZCOOL_XiaoWei({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-app-display",
});

export const metadata: Metadata = {
  title: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_SHORT_NAME,
  /** favicon / PWA / iOS 主屏幕均使用 logo.ico（发布路径 `/logo.ico`） */
  icons: {
    icon: [{ url: APP_ICON_PATH, type: "image/x-icon", sizes: "any" }],
    apple: [{ url: APP_ICON_PATH, type: "image/x-icon", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: APP_DISPLAY_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f0b429",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
