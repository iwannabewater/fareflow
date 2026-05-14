import { expect, test } from "@playwright/test";

test("serves manifest and localized offline fallback", async ({ page }) => {
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  expect(await manifestResponse.json()).toMatchObject({
    name: "FareFlow",
    display: "standalone",
  });

  await page.goto("/~offline");
  await expect(page.getByText("FareFlow 当前离线")).toBeVisible();
});
