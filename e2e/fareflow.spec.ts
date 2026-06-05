import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/fareflow/");
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
  await page.getByLabel("旅程预算").fill("3500");
  await page.getByRole("button", { name: "创建旅程" }).click();

  await expectCurrentTrip(page, "首尔周末");
  await expectVisibleText(page, "预算自动驾驶");

  await openExpenseDrawer(page);
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("金额").fill("42.80");
  await page.getByRole("button", { name: "交通", exact: true }).click();
  await page.getByLabel("备注").fill("机场巴士");
  await expectNoHorizontalOverflow(page);
  await expect(page.getByText("预览")).toBeVisible();
  await page.getByRole("button", { name: "保存支出" }).click();
  await expect(page.getByRole("heading", { name: "新增支出" })).toBeHidden();

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

  await page.getByRole("button", { name: /在账本中聚焦分类：交通/ }).click();
  await expect(page.getByText("账本聚焦")).toBeVisible();
  await expect(page.getByText("分类：交通")).toBeVisible();
  await expect(
    page.getByRole("article").filter({ hasText: "机场巴士" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "清除" }).click();
  await expect(page.getByText("账本聚焦")).toBeHidden();

  await page.getByRole("button", { name: /在账本中聚焦日期：/ }).click();
  await expect(page.getByText("账本聚焦")).toBeVisible();
  await expect(page.getByText(/日期：/)).toBeVisible();
  await page.getByRole("button", { name: "清除" }).click();

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
  await openExpenseDrawer(page);
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("金额").fill("18");
  await page.getByLabel("备注").fill("离线章鱼烧");
  await page.getByRole("button", { name: "保存支出" }).click();
  await expect(page.getByRole("heading", { name: "新增支出" })).toBeHidden();

  await expect(page.getByText("离线章鱼烧")).toBeVisible();
  await expect(page.getByText("待同步").first()).toBeVisible();

  await context.setOffline(false);
  await gotoWithNetworkRetry(page, "/fareflow/");
  await expectCurrentTrip(page, "离线测试");
  await expect(page.getByText("离线章鱼烧")).toBeVisible({
    timeout: 10_000,
  });
});

test("rejects an expense dated outside a finished trip", async ({ page }) => {
  await openTripDrawer(page);
  await page.getByLabel("旅程名称").fill("日期边界测试");
  await page.getByLabel("目的地").fill("京都");
  await page.getByLabel("开始").fill("2026-05-14");
  await page.getByLabel("结束").fill("2026-05-17");
  await page.getByRole("button", { name: "创建旅程" }).click();

  await expectCurrentTrip(page, "日期边界测试");

  await openExpenseDrawer(page);
  await expectNoHorizontalOverflow(page);
  await expect(
    page.getByText(/可记账日期：.*2026年5月14日.*至.*2026年5月17日/),
  ).toBeVisible();
  await page.getByLabel("金额").fill("23");
  await page.getByLabel("日期").fill("2026-05-23");
  await page.getByRole("button", { name: "保存支出" }).click();

  await expect(
    page.getByText("支出日期需在旅程日期内；如需补记，请先编辑旅程时间。"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "新增支出" })).toBeVisible();
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

async function expectVisibleText(
  page: import("@playwright/test").Page,
  text: string,
) {
  await expect(
    page.getByText(text).filter({ visible: true }).first(),
  ).toBeVisible();
}

async function openExpenseDrawer(page: import("@playwright/test").Page) {
  const trigger = page.getByRole("button", { name: "添加支出" }).last();
  await expect(trigger).toBeEnabled();
  await trigger.click();
  await expect(page.getByRole("heading", { name: "新增支出" })).toBeVisible();
}

async function gotoWithNetworkRetry(
  page: import("@playwright/test").Page,
  url: string,
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("ERR_ABORTED") || attempt === 1) {
        throw error;
      }
      await page.waitForTimeout(250);
    }
  }
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
