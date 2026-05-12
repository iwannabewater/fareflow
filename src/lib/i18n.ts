"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CurrencyCode, ExpenseCategory } from "@/lib/domain/schema";

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === "en" ? "zh" : "en" }),
    }),
    {
      name: "fareflow-locale",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const dictionaries = {
  en: {
    languageName: "English",
    switchLanguage: "中文",
    switchLanguageAria: "Switch language to Chinese",
    localeCode: "en-US",
    appName: "FareFlow",
    tagline: "Offline travel ledger",
    common: {
      backToApp: "Back to FareFlow",
      notSet: "Not set",
      saving: "Saving…",
      close: "Close",
    },
    auth: {
      label: "Supabase magic link",
      placeholder: "you@example.com",
      send: "Send magic link",
      sent: "Magic link sent. Check your inbox.",
      fallbackError: "We could not send a sign-in link.",
      localDemo: "Local demo mode",
      localDemoDescription:
        "Add Supabase env vars to enable auth, RLS, and cloud sync.",
      cloudReady: "Cloud sync ready",
      signOut: "Sign out",
    },
    confirm: {
      checkingTitle: "Confirming sign-in",
      checkingDescription: "FareFlow is securing your session.",
      successTitle: "Signed in",
      successDescription: "Returning to your travel ledger.",
      failedTitle: "Sign-in link failed",
      missingToken: "The sign-in link is missing a session token.",
      fallbackError: "The sign-in link could not be confirmed.",
    },
    sync: {
      offline: "Offline",
      online: "Online",
      syncing: "Syncing",
      synced: (count: number) => `${count} synced`,
      status: {
        pending: "pending",
        syncing: "syncing",
        synced: "synced",
        failed: "failed",
      },
    },
    home: {
      currentJourney: "Current journey",
      firstTripTitle: "Set up your first trip",
      createTripPrompt: "Create a trip to start tracking offline expenses.",
      selectTrip: "Select trip",
      tripTotal: "Trip total",
      noTripSelected: "No trip selected",
      items: "Items",
      pending: "Pending",
      noExpensesTitle: "No expenses yet",
      noExpensesDescription:
        "Add the first cost before boarding or while offline in the air.",
      expenses: "Expenses",
      itemCount: (count: number) => `${count} items`,
      tripState: "Trip state",
      destination: "Destination",
      baseCurrency: "Base currency",
      currentTotal: "Current total",
      pendingSync: "Pending sync",
    },
    trip: {
      trigger: "Trip",
      newTitle: "New trip",
      description: "Trips can be drafted offline and synced before expenses.",
      name: "Trip name",
      namePlaceholder: "Lisbon work week…",
      destination: "Destination",
      destinationPlaceholder: "Lisbon, Porto…",
      start: "Start",
      end: "End",
      baseCurrency: "Base currency",
      create: "Create trip",
    },
    expense: {
      trigger: "Add expense",
      newTitle: "New expense",
      description: "Saved locally first; synced to Supabase when available.",
      amount: "Amount",
      amountPlaceholder: "42.80…",
      currency: "Currency",
      date: "Date",
      rate: "Rate",
      category: "Category",
      note: "Note",
      notePlaceholder: "Airport taxi…",
      save: "Save expense",
      selectTripFirst: "Select a trip before adding an expense.",
    },
    categories: {
      food: "Food",
      transport: "Transport",
      lodging: "Lodging",
      sights: "Sights",
      shopping: "Shopping",
      health: "Health",
      other: "Other",
    } satisfies Record<ExpenseCategory, string>,
    currencies: {
      USD: "US dollar",
      EUR: "Euro",
      GBP: "British pound",
      JPY: "Japanese yen",
      CNY: "Chinese yuan",
      THB: "Thai baht",
      SGD: "Singapore dollar",
      AUD: "Australian dollar",
    } satisfies Record<CurrencyCode, string>,
    validation: {
      "Name this trip": "Name this trip",
      "Add a destination": "Add a destination",
      "Use a valid start date": "Use a valid start date",
      "Use a valid end date": "Use a valid end date",
      "End date must be after the start date":
        "End date must be after the start date",
      "Use a valid amount": "Use a valid amount",
      "Use a valid rate": "Use a valid rate",
      "Use a valid date": "Use a valid date",
    },
  },
  zh: {
    languageName: "中文",
    switchLanguage: "EN",
    switchLanguageAria: "切换为英文",
    localeCode: "zh-CN",
    appName: "FareFlow",
    tagline: "离线旅行账本",
    common: {
      backToApp: "返回 FareFlow",
      notSet: "未设置",
      saving: "保存中…",
      close: "关闭",
    },
    auth: {
      label: "邮箱登录链接",
      placeholder: "you@example.com",
      send: "发送登录链接",
      sent: "登录链接已发送，请检查邮箱。",
      fallbackError: "登录链接发送失败。",
      localDemo: "本地演示模式",
      localDemoDescription:
        "添加 Supabase 环境变量后即可启用登录、RLS 和云端同步。",
      cloudReady: "云端同步已就绪",
      signOut: "退出登录",
    },
    confirm: {
      checkingTitle: "正在确认登录",
      checkingDescription: "FareFlow 正在建立安全会话。",
      successTitle: "已登录",
      successDescription: "正在返回你的旅行账本。",
      failedTitle: "登录链接无效",
      missingToken: "登录链接缺少会话令牌。",
      fallbackError: "无法确认该登录链接。",
    },
    sync: {
      offline: "离线",
      online: "在线",
      syncing: "同步中",
      synced: (count: number) => `已同步 ${count} 项`,
      status: {
        pending: "待同步",
        syncing: "同步中",
        synced: "已同步",
        failed: "失败",
      },
    },
    home: {
      currentJourney: "当前旅程",
      firstTripTitle: "创建第一段旅程",
      createTripPrompt: "创建旅程后即可开始记录离线支出。",
      selectTrip: "选择旅程",
      tripTotal: "旅程总额",
      noTripSelected: "尚未选择旅程",
      items: "笔数",
      pending: "待同步",
      noExpensesTitle: "还没有支出",
      noExpensesDescription: "登机前或飞行离线时，都可以先记录第一笔花费。",
      expenses: "支出记录",
      itemCount: (count: number) => `${count} 笔`,
      tripState: "旅程状态",
      destination: "目的地",
      baseCurrency: "基准货币",
      currentTotal: "当前总额",
      pendingSync: "待同步",
    },
    trip: {
      trigger: "旅程",
      newTitle: "新建旅程",
      description: "旅程可先离线草稿保存，再同步到云端。",
      name: "旅程名称",
      namePlaceholder: "里斯本工作周…",
      destination: "目的地",
      destinationPlaceholder: "里斯本、波尔图…",
      start: "开始",
      end: "结束",
      baseCurrency: "基准货币",
      create: "创建旅程",
    },
    expense: {
      trigger: "添加支出",
      newTitle: "新增支出",
      description: "先保存到本机；网络可用时自动同步到 Supabase。",
      amount: "金额",
      amountPlaceholder: "42.80…",
      currency: "币种",
      date: "日期",
      rate: "汇率",
      category: "分类",
      note: "备注",
      notePlaceholder: "机场出租车…",
      save: "保存支出",
      selectTripFirst: "请先选择一个旅程。",
    },
    categories: {
      food: "餐饮",
      transport: "交通",
      lodging: "住宿",
      sights: "景点",
      shopping: "购物",
      health: "健康",
      other: "其他",
    } satisfies Record<ExpenseCategory, string>,
    currencies: {
      USD: "美元",
      EUR: "欧元",
      GBP: "英镑",
      JPY: "日元",
      CNY: "人民币",
      THB: "泰铢",
      SGD: "新加坡元",
      AUD: "澳元",
    } satisfies Record<CurrencyCode, string>,
    validation: {
      "Name this trip": "请填写旅程名称",
      "Add a destination": "请填写目的地",
      "Use a valid start date": "请选择有效的开始日期",
      "Use a valid end date": "请选择有效的结束日期",
      "End date must be after the start date": "结束日期不能早于开始日期",
      "Use a valid amount": "请输入有效金额",
      "Use a valid rate": "请输入有效汇率",
      "Use a valid date": "请选择有效日期",
    },
  },
} as const;

export type FareFlowCopy = (typeof dictionaries)[Locale];

export function useCopy() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const toggleLocale = useLocaleStore((state) => state.toggleLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  return {
    locale,
    setLocale,
    toggleLocale,
    t: dictionaries[locale],
  };
}

export function translateValidationError(
  value: string | undefined,
  copy: FareFlowCopy,
) {
  if (!value) {
    return undefined;
  }

  return copy.validation[value as keyof typeof copy.validation] ?? value;
}
