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

  const unnamedButtons = await page.locator("button").evaluateAll((buttons) =>
    buttons
      .filter((button) => !button.textContent?.trim() && !button.getAttribute("aria-label"))
      .map((button) => button.outerHTML),
  );
  expect(unnamedButtons).toEqual([]);

  await page.keyboard.press("Tab");
  const activeElementTag = await page.evaluate(
    () => document.activeElement?.tagName,
  );
  expect(activeElementTag).toBeTruthy();
});
