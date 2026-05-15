import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "旅程" }).first()).toBeVisible();
  await page.waitForTimeout(250);
});

test("creates a trip, adds, edits, exports, and deletes an expense", async ({
  page,
}) => {
  await openTripDrawer(page);
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("旅程名称").fill("首尔周末");
  await page.getByLabel("目的地").fill("首尔");
  await page.getByRole("button", { name: "创建旅程" }).click();

  await expectCurrentTrip(page, "首尔周末");

  await page.getByRole("button", { name: "添加支出" }).first().click();
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("金额").fill("42.80");
  await page.getByRole("button", { name: "交通", exact: true }).click();
  await page.getByLabel("备注").fill("机场巴士");
  await expectNoHorizontalOverflow(page);
  await expect(page.getByText("预览")).toBeVisible();
  await page.getByRole("button", { name: "保存支出" }).click();

  await expect(page.getByText("机场巴士")).toBeVisible();
  await page.getByRole("button", { name: "圆环" }).click();
  await expect(page.getByRole("img", { name: "分类占比圆环图" })).toBeVisible();
  await page.getByRole("button", { name: "条形" }).click();

  await page.getByRole("button", { name: "编辑支出" }).click();
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("金额").fill("99.00");
  await page.getByRole("button", { name: "更新支出" }).click();
  await expect(
    page.getByRole("article").filter({ hasText: "机场巴士" }).getByText(/99\.00/),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "导出当前旅程支出 CSV" })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("首尔周末");
  expect(download.suggestedFilename()).toContain("expenses.csv");

  await page.getByRole("button", { name: "删除支出" }).click();
  await expect(page.getByText("删除这笔支出？")).toBeVisible();
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await expect(page.getByText("机场巴士")).toBeHidden();
});

test("adds an expense offline and keeps it queued after network recovery", async ({
  page,
  context,
}) => {
  await openTripDrawer(page);
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("旅程名称").fill("离线测试");
  await page.getByLabel("目的地").fill("大阪");
  await page.getByRole("button", { name: "创建旅程" }).click();
  await expectCurrentTrip(page, "离线测试");

  await context.setOffline(true);
  await page.getByRole("button", { name: "添加支出" }).first().click();
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("金额").fill("18");
  await page.getByLabel("备注").fill("离线章鱼烧");
  await page.getByRole("button", { name: "保存支出" }).click();

  await expect(page.getByText("离线章鱼烧")).toBeVisible();
  await expect(page.getByText("待同步").first()).toBeVisible();

  await context.setOffline(false);
  await page.reload();
  await expect(page.getByText("离线章鱼烧")).toBeVisible();
});

async function expectCurrentTrip(
  page: import("@playwright/test").Page,
  title: string,
) {
  await expect(page.getByRole("button", { name: "选择旅程" })).toContainText(
    title,
  );
}

async function openTripDrawer(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "旅程" }).first().click();
  await expect(page.getByRole("heading", { name: "新建旅程" })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scrollWidth = Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth,
        );

        return scrollWidth <= window.innerWidth + 1;
      }),
    )
    .toBe(true);
}
