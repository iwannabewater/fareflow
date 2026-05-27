import { expect, test } from "@playwright/test";

test("serves manifest and localized offline fallback", async ({ page }) => {
  const rootResponse = await page.request.get("/fareflow", {
    maxRedirects: 0,
  });
  expect(rootResponse.status()).toBe(308);
  expect(rootResponse.headers().location).toBe("/fareflow/");

  const manifestResponse = await page.request.get("/fareflow/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  expect(await manifestResponse.json()).toMatchObject({
    name: "FareFlow",
    display: "standalone",
    start_url: "/fareflow/",
    scope: "/fareflow/",
  });

  await page.goto("/fareflow/~offline/");
  await expect(page.getByText("FareFlow 当前离线")).toBeVisible();
});
