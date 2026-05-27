import { describe, expect, it } from "vitest";
import { APP_BASE_PATH, withAppBasePath } from "@/lib/app-paths";

describe("public app paths", () => {
  it("keeps all public routes under the FareFlow mount point", () => {
    expect(APP_BASE_PATH).toBe("/fareflow");
    expect(withAppBasePath("/")).toBe("/fareflow/");
    expect(withAppBasePath("/auth/confirm/")).toBe("/fareflow/auth/confirm/");
    expect(withAppBasePath("/fareflow/manifest.webmanifest")).toBe(
      "/fareflow/manifest.webmanifest",
    );
  });
});
