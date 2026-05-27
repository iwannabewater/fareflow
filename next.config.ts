import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { APP_BASE_PATH } from "./src/lib/app-paths";

const FONT_PRECACHE_ASSET_PATTERN = /static\/media\/.*\.(?:woff2?|ttf|otf)$/;

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH,
  trailingSlash: true,
  reactStrictMode: true,
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: false,
  cacheStartUrl: true,
  dynamicStartUrl: true,
  fallbacks: {
    document: "/~offline/",
  },
  workboxOptions: {
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    manifestTransforms: [
      (entries) => ({
        manifest: entries.filter(({ url }) => !FONT_PRECACHE_ASSET_PATTERN.test(url)),
        warnings: [],
      }),
    ],
  },
});

export default withPWA(nextConfig);
