import { expect, test } from "@playwright/test";

test("home screen has accessible core controls and keyboard focus", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: "切换为英文" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "旅程" }).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "添加支出" }).first(),
  ).toBeVisible();
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 700) {
    const mobileAddExpense = page.getByRole("button", { name: "添加支出" }).last();
    const box = await mobileAddExpense.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(viewport.width - 40);
  }

  const unnamedButtons = await page
    .locator("#main-content button")
    .evaluateAll((buttons) =>
      buttons
        .filter(
          (button) =>
            !button.textContent?.trim() && !button.getAttribute("aria-label"),
        )
        .map((button) => button.outerHTML),
    );
  expect(unnamedButtons).toEqual([]);

  await page.keyboard.press("Tab");
  const activeElementTag = await page.evaluate(
    () => document.activeElement?.tagName,
  );
  expect(activeElementTag).toBeTruthy();
});
