import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/domain/schema";
import {
  isValidQuickCaptureRate,
  parseQuickCaptureDraft,
} from "@/lib/expenses/quick-capture";

const baseTrip: Trip = {
  id: "11111111-1111-4111-8111-111111111111",
  clientId: "22222222-2222-4222-8222-222222222222",
  userId: "local-user",
  title: "东京五日",
  destination: "东京",
  baseCurrency: "CNY",
  budgetAmount: 800000,
  startDate: "2026-06-04",
  endDate: "2026-06-09",
  createdAt: "2026-06-01T00:00:00.000Z",
  syncStatus: "pending",
};

describe("quick capture parser", () => {
  it("parses a local-currency Chinese transport entry", () => {
    const parsed = parseQuickCaptureDraft(
      "市区地铁 68 CNY 今天",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "68",
      amountMinor: 6800,
      currency: "CNY",
      category: "transport",
      expenseDate: "2026-06-05",
      note: "市区地铁",
      issues: [],
      isReady: true,
    });
  });

  it("cleans Chinese spend verbs from natural transport notes", () => {
    const parsed = parseQuickCaptureDraft(
      "今天打车花了15元",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "15",
      amountMinor: 1500,
      currency: "CNY",
      category: "transport",
      expenseDate: "2026-06-05",
      note: "打车",
      issues: [],
      isReady: true,
    });
  });

  it("keeps the note clean when the amount comes before the activity", () => {
    const parsed = parseQuickCaptureDraft(
      "花了15元打车",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "15",
      category: "transport",
      note: "打车",
      isReady: true,
    });
  });

  it("removes purchase verbs while preserving the useful noun phrase", () => {
    const parsed = parseQuickCaptureDraft(
      "今天买门票花了120元",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "120",
      category: "sights",
      note: "门票",
      isReady: true,
    });
  });

  it("normalizes casual entertainment notes without leaving filler verbs", () => {
    const parsed = parseQuickCaptureDraft(
      "去ktv唱歌花了200元",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "200",
      category: "other",
      note: "KTV•唱歌",
      isReady: true,
    });
  });

  it.each([
    {
      input: "我今天去食堂吃了一份饺子花了17块钱",
      amountMajor: "17",
      category: "food",
      note: "食堂•饺子",
    },
    {
      input: "我今天去食堂吃了一份饺子花了十七块钱",
      amountMajor: "17",
      category: "food",
      note: "食堂•饺子",
    },
    {
      input: "我今天在食堂吃饺子17块",
      amountMajor: "17",
      category: "food",
      note: "食堂•饺子",
    },
    {
      input: "午餐一共花了45.5元",
      amountMajor: "45.5",
      category: "food",
      note: "午餐",
    },
    {
      input: "一杯咖啡28元",
      amountMajor: "28",
      category: "food",
      note: "咖啡",
    },
    {
      input: "2人晚餐 200 元",
      amountMajor: "200",
      category: "food",
      note: "晚餐",
    },
    {
      input: "两个人晚餐200",
      amountMajor: "200",
      category: "food",
      note: "晚餐",
    },
    {
      input: "一人一杯咖啡 28",
      amountMajor: "28",
      category: "food",
      note: "咖啡",
    },
    {
      input: "便利店买水12",
      amountMajor: "12",
      category: "food",
      note: "便利店•水",
    },
    {
      input: "超市买饮料12元",
      amountMajor: "12",
      category: "food",
      note: "超市•饮料",
    },
    {
      input: "药店买药36元",
      amountMajor: "36",
      category: "health",
      note: "药",
    },
    {
      input: "医院看病120元",
      amountMajor: "120",
      category: "health",
      note: "看病",
    },
    {
      input: "今天去医院挂号花了20元",
      amountMajor: "20",
      category: "health",
      note: "挂号",
    },
    {
      input: "诊所看病80元",
      amountMajor: "80",
      category: "health",
      note: "看病",
    },
    {
      input: "看病120元",
      amountMajor: "120",
      category: "health",
      note: "看病",
    },
    {
      input: "医院•看病120元",
      amountMajor: "120",
      category: "health",
      note: "看病",
    },
    {
      input: "支付酒店押金500元",
      amountMajor: "500",
      category: "lodging",
      note: "酒店•押金",
    },
    {
      input: "订酒店两晚600元",
      amountMajor: "600",
      category: "lodging",
      note: "酒店",
    },
    {
      input: "打车到机场 86块钱",
      amountMajor: "86",
      category: "transport",
      note: "打车到机场",
    },
    {
      input: "人民币86打车",
      amountMajor: "86",
      category: "transport",
      note: "打车",
    },
    {
      input: "RMB 86 打车",
      amountMajor: "86",
      category: "transport",
      note: "打车",
    },
    {
      input: "今天付了68元地铁",
      amountMajor: "68",
      category: "transport",
      note: "地铁",
    },
    {
      input: "一杯咖啡二十八元",
      amountMajor: "28",
      category: "food",
      note: "咖啡",
    },
    {
      input: "打车三块五",
      amountMajor: "3.5",
      category: "transport",
      note: "打车",
    },
    {
      input: "打车17块5",
      amountMajor: "17.5",
      category: "transport",
      note: "打车",
    },
    {
      input: "今天买了两张门票240元",
      amountMajor: "240",
      category: "sights",
      note: "门票",
    },
    {
      input: "两张门票 240",
      amountMajor: "240",
      category: "sights",
      note: "门票",
    },
    {
      input: "7-11买水8元",
      amountMajor: "8",
      category: "food",
      note: "7-11•水",
    },
    {
      input: "6/5 打车 20元",
      amountMajor: "20",
      category: "transport",
      note: "打车",
    },
    {
      input: "6-5日 打车20元",
      amountMajor: "20",
      category: "transport",
      note: "打车",
    },
    {
      input: "coffee $4.50 today",
      amountMajor: "4.50",
      category: "food",
      note: "coffee",
    },
    {
      input: "spent 12 on coffee today",
      amountMajor: "12",
      category: "food",
      note: "coffee",
    },
    {
      input: "2026年6月5日 打车￥20",
      amountMajor: "20",
      category: "transport",
      note: "打车",
    },
    {
      input: "食堂·饺子17元",
      amountMajor: "17",
      category: "food",
      note: "食堂•饺子",
    },
    {
      input: "拉面JPY1800昨天",
      amountMajor: "1800",
      category: "food",
      expenseDate: "2026-06-04",
      note: "拉面",
    },
  ])(
    "normalizes colloquial Chinese expense notes: $input",
    ({ input, amountMajor, category, expenseDate = "2026-06-05", note }) => {
      const parsed = parseQuickCaptureDraft(input, baseTrip, "2026-06-05");

      expect(parsed).toMatchObject({
        amountMajor,
        category,
        expenseDate,
        note,
        issues: [],
        isReady: true,
      });
      expect(parsed?.note).not.toMatch(
        /(?:钱|花了|付了|支付|买了|吃了|喝了|一份|一杯|两张|2人)/,
      );
    },
  );

  it.each([
    {
      input: "饺子17元",
      category: "food",
      note: "饺子",
    },
    {
      input: "食堂17元",
      category: "food",
      note: "食堂",
    },
    {
      input: "酒店600元",
      category: "lodging",
      note: "酒店",
    },
    {
      input: "机场巴士42",
      category: "transport",
      note: "机场巴士",
    },
    {
      input: "早餐18元",
      category: "food",
      note: "早餐",
    },
    {
      input: "KTV200元",
      category: "other",
      note: "KTV",
    },
    {
      input: "医院120元",
      category: "health",
      note: "医院",
    },
    {
      input: "药店36元",
      category: "health",
      note: "药店",
    },
    {
      input: "诊所80元",
      category: "health",
      note: "诊所",
    },
  ])("does not over-segment object-only notes: $input", ({ input, category, note }) => {
    const parsed = parseQuickCaptureDraft(input, baseTrip, "2026-06-05");

    expect(parsed).toMatchObject({
      category,
      note,
      issues: [],
      isReady: true,
    });
    expect(parsed?.note).not.toContain("•");
  });

  it("cleans notes even when the amount is missing", () => {
    const parsed = parseQuickCaptureDraft(
      "今天打车花了",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: null,
      category: "transport",
      note: "打车",
      isReady: false,
    });
    expect(parsed?.issues).toContain("amount");
  });

  it.each([
    {
      input: "我今天在食堂吃了一份饺子花了",
      category: "food",
      note: "食堂•饺子",
    },
    {
      input: "今天买了两张门票",
      category: "sights",
      note: "门票",
    },
  ])(
    "keeps missing-amount previews readable: $input",
    ({ input, category, note }) => {
      const parsed = parseQuickCaptureDraft(input, baseTrip, "2026-06-05");

      expect(parsed).toMatchObject({
        amountMajor: null,
        category,
        note,
        isReady: false,
      });
      expect(parsed?.issues).toContain("amount");
    },
  );

  it("cleans casual entertainment notes when the amount is missing", () => {
    const parsed = parseQuickCaptureDraft(
      "去ktv唱歌花了",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: null,
      category: "other",
      note: "KTV•唱歌",
      isReady: false,
    });
    expect(parsed?.issues).toContain("amount");
  });

  it("cleans English cost phrases", () => {
    const parsed = parseQuickCaptureDraft(
      "taxi cost 24 today",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "24",
      category: "transport",
      note: "taxi",
      isReady: true,
    });
  });

  it("parses an overseas cash entry and relative date", () => {
    const parsed = parseQuickCaptureDraft(
      "拉面 1800 JPY 昨天",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "1800",
      amountMinor: 1800,
      currency: "JPY",
      category: "food",
      expenseDate: "2026-06-04",
      note: "拉面",
      issues: [],
      isReady: true,
    });
  });

  it("flags invalid precision for zero-decimal currencies", () => {
    const parsed = parseQuickCaptureDraft(
      "拉面 1800.5 JPY 今天",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed?.issues).toContain("amount");
    expect(parsed?.isReady).toBe(false);
  });

  it("flags dates outside the selected trip", () => {
    const parsed = parseQuickCaptureDraft(
      "门票 120 CNY 6/12",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      category: "sights",
      expenseDate: "2026-06-12",
      isReady: false,
    });
    expect(parsed?.issues).toContain("date");
  });

  it("validates manual exchange rates", () => {
    expect(isValidQuickCaptureRate("0.047")).toBe(true);
    expect(isValidQuickCaptureRate("1.12345678")).toBe(true);
    expect(isValidQuickCaptureRate("0")).toBe(false);
    expect(isValidQuickCaptureRate("1.123456789")).toBe(false);
  });
});
