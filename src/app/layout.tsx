import type { Metadata } from "next";
import type { Viewport } from "next";
import "@fontsource/alegreya/400.css";
import "@fontsource/alegreya/600.css";
import "@fontsource/alegreya/700.css";
import "@fontsource/comic-neue/400.css";
import "@fontsource/comic-neue/700.css";
import "@fontsource/zcool-kuaile/chinese-simplified.css";
import "lxgw-wenkai-webfont/lxgwwenkai-regular.css";
import "lxgw-wenkai-webfont/lxgwwenkai-bold.css";
import "./globals.css";
import { AppProviders } from "@/lib/query/providers";
import { withAppBasePath } from "@/lib/app-paths";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "FareFlow",
  description:
    "一款移动优先的旅行支出 PWA，支持本地优先记录和 Supabase 同步。",
  manifest: withAppBasePath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    title: "FareFlow",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: withAppBasePath("/icons/icon.svg"), type: "image/svg+xml" },
      {
        url: withAppBasePath("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: withAppBasePath("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: withAppBasePath("/icons/apple-touch-icon.png"),
        sizes: "180x180",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f0df",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-svh">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-3 focus:text-canvas"
        >
          跳到主内容
        </a>
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
