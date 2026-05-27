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

test("installs the scoped worker and reloads the application offline", async ({
  context,
  page,
}) => {
  await page.goto("/fareflow/");

  const registration = await page.evaluate(async () => {
    const worker = await navigator.serviceWorker.ready;
    return {
      scope: worker.scope,
      scriptURL: worker.active?.scriptURL ?? "",
    };
  });

  expect(registration.scope).toBe(new URL("/fareflow/", page.url()).toString());
  expect(registration.scriptURL).toBe(new URL("/fareflow/sw.js", page.url()).toString());

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("FareFlow").first()).toBeVisible();
});
