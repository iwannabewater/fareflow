import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!$|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-|icons/).*)",
  ],
};
