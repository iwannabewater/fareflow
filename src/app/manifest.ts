import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FareFlow",
    short_name: "FareFlow",
    description: "移动优先的旅行支出 PWA，支持离线记录和 Supabase 同步。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f0df",
    theme_color: "#f5f0df",
    orientation: "portrait",
    categories: ["finance", "travel", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
