export type AuthCallback =
  | {
      kind: "session";
      accessToken: string;
      refreshToken: string;
      next: string;
    }
  | {
      kind: "code";
      code: string;
      next: string;
    }
  | {
      kind: "otp";
      tokenHash: string;
      type: string;
      next: string;
    }
  | {
      kind: "error";
      message: string;
      next: string;
    }
  | {
      kind: "missing";
      next: string;
    };

export function parseAuthCallbackUrl(value: string): AuthCallback {
  const url = new URL(value);
  const search = url.searchParams;
  const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
  const next = sanitizeNextPath(search.get("next") ?? hash.get("next"));
  const error =
    search.get("error_description") ??
    search.get("error") ??
    hash.get("error_description") ??
    hash.get("error");

  if (error) {
    return { kind: "error", message: error, next };
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    return { kind: "session", accessToken, refreshToken, next };
  }

  const code = search.get("code");
  if (code) {
    return { kind: "code", code, next };
  }

  const tokenHash = search.get("token_hash");
  const type = search.get("type");
  if (tokenHash && type) {
    return { kind: "otp", tokenHash, type, next };
  }

  return { kind: "missing", next };
}

export function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
