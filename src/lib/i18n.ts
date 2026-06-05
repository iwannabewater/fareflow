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
      locale: "zh",
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
    tagline: "Travel expense companion",
    common: {
      backToApp: "Back to FareFlow",
      notSet: "Not set",
      saving: "Saving…",
      retry: "Retry",
      reload: "Reload",
      close: "Close",
    },
    recovery: {
      offlineTitle: "FareFlow is offline",
      offlineDescription:
        "Your cached trips and pending expenses stay on this device. Reconnect to sync them with Supabase.",
      offlineAction: "Return to ledger",
      loadingTitle: "Preparing your travel ledger",
      loadingDescription: "FareFlow is checking local records and sync state.",
      notFoundTitle: "This page is not in the itinerary",
      notFoundDescription:
        "The page may have moved, or the link may no longer be valid.",
      appErrorTitle: "FareFlow hit a recoverable error",
      appErrorDescription:
        "Your local records are still on this device. Retry the view or return to the ledger.",
      queryErrorTitle: "Could not load the latest records",
      queryErrorDescription:
        "Check your connection or Supabase status, then retry.",
      storageErrorTitle: "Offline storage is unavailable",
      storageErrorDescription:
        "FareFlow needs IndexedDB for offline capture. Enable browser storage or retry in a normal browser session.",
    },
    auth: {
      label: "Supabase magic link",
      placeholder: "you@example.com",
      send: "Send magic link",
      sent: "Magic link sent. Check your inbox.",
      recentLink:
        "A fresh sign-in link was already sent. Use the newest email, or resend after the timer.",
      fallbackError: "We could not send a sign-in link.",
      rateLimit:
        "The sign-in email provider is cooling down. Use the newest email, or resend shortly.",
      retryAfter: (seconds: number) => `Try again in ${seconds}s`,
      localDemo: "Local demo mode",
      localDemoDescription:
        "Add Supabase env vars to enable auth, RLS, and cloud sync.",
      cloudReady: "Cloud connected",
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
      pendingCount: (count: number) => `${count} pending`,
      failedCount: (count: number) => `${count} failed`,
      retryFailed: "Retry failed sync",
      retryFailedAria: "Retry failed sync records",
      status: {
        pending: "pending",
        syncing: "syncing",
        synced: "synced",
        failed: "failed",
      },
    },
    home: {
      currentJourney: "Current journey",
      actionCenter: "Current trip overview",
      firstTripTitle: "Set up your first trip",
      createTripPrompt: "Create a trip to start tracking expenses.",
      selectTrip: "Select trip",
      tripTotal: "Trip total",
      todaySpend: "Today",
      budgetRemaining: "Budget left",
      budgetTotal: "Trip budget",
      budgetSpentOver: "Over budget",
      budgetPlaceholder: "Not set",
      budgetAutopilot: "Budget pace",
      budgetRunway: "Today guide",
      budgetLeft: "Budget left",
      budgetBuffer: "Today left",
      budgetOverrun: "Today over",
      budgetUnsetPrompt:
        "Set a trip budget to calculate a daily guide and budget left.",
      budgetOnTrack: "On budget",
      budgetWatch: "Tight today",
      budgetOver: "Over total budget",
      tripDays: "Trip days",
      expenseDays: "Expense days",
      categoriesTracked: "Categories",
      noTripSelected: "No trip selected",
      quickCapture: "Quick capture",
      quickCaptureBadge: "Offline ready",
      quickCaptureSample: "taxi 24 today",
      quickCaptureEmptyTitle: "Pick a trip first",
      quickCaptureEmptyDescription:
        "Once a trip is selected, capture a spend line without opening the full form.",
      quickCaptureDescription:
        "Type amount, category, and date. FareFlow parses the line and saves it locally first.",
      quickCapturePlaceholder: (currency: CurrencyCode) =>
        `Try: taxi 24 ${currency} today`,
      quickCaptureExamples: (currency: CurrencyCode) => [
        `taxi 24 ${currency} today`,
        "ramen 1800 JPY yesterday",
        `museum 18 ${currency}`,
      ],
      quickCaptureIdle: "The parsed amount, category, and date appear here.",
      quickCapturePreview: "Parsed entry",
      quickCaptureAmount: "Amount",
      quickCaptureCategory: "Category",
      quickCaptureDate: "Date",
      quickCaptureNote: "Note",
      quickCaptureRate: "Exchange rate",
      quickCaptureRateHelper: (
        currency: CurrencyCode,
        baseCurrency: CurrencyCode,
      ) => `How many ${baseCurrency} is 1 ${currency}?`,
      quickCaptureMissingAmount: "Add an amount",
      quickCaptureOutOfRange: "Date is outside this trip",
      quickCaptureSave: "Confirm entry",
      quickCaptureSaved: (amount: string) => `${amount} saved`,
      quickCaptureFailed: "Could not save this entry.",
      quickCaptureNoNote: "No note",
      quickCaptureReady: "Ready",
      quickCaptureNeedsRate: "Needs rate",
      items: "Items",
      pending: "Pending",
      noExpensesTitle: "No expenses yet",
      noExpensesDescription:
        "Add the first cost before boarding, during transit, or at arrival.",
      expenses: "Expenses",
      recentExpenses: "Recent expenses",
      itemCount: (count: number) => `${count} items`,
      allExpenses: "All",
      expenseFilterAria: "Filter expense records",
      tripList: "Saved trips",
      tripState: "Trip state",
      destination: "Destination",
      baseCurrency: "Base currency",
      currentTotal: "Current total",
      pendingSync: "Pending sync",
      dashboard: "Dashboard",
      journeyRhythm: "Journey rhythm",
      routeProgress: "Route progress",
      remainingDays: "Days left",
      journeyUpcoming: "Preparing",
      journeyActive: "On route",
      journeyComplete: "Complete",
      noRhythm: "Create a trip to see spend pace.",
      todayRhythmBrief: "Today's brief",
      paceForecast: "Forecast",
      loggedCoverage: "Logged days",
      journeyDay: (current: number, total: number) =>
        current > 0 ? `Day ${current}/${total}` : `${total} days`,
      journeyBriefUpcoming: (days: number) =>
        `Starts in ${days} day${days === 1 ? "" : "s"}. Set the route now, then spend pace will appear after the first expense.`,
      journeyBudgetBriefUpcoming: (budget: string, runway: string) =>
        `${budget} budget set. Daily reference is about ${runway}.`,
      journeyBriefActiveEmpty: (day: number, total: number) =>
        `Day ${day}/${total}, with no spend logged yet. Add the first expense to see today's pace.`,
      journeyBudgetBriefActiveEmpty: (
        day: number,
        total: number,
        runway: string,
      ) =>
        `Day ${day}/${total}, with no spend logged yet. Today's guide is ${runway}.`,
      journeyBriefActiveToday: (today: string, forecast: string) =>
        `Today is at ${today}. Based on current records, the full trip is forecast at ${forecast}.`,
      journeyBudgetBriefActiveToday: (
        today: string,
        runway: string,
        delta: string,
      ) =>
        `Today is at ${today}. Today's guide is ${runway}; ${delta}.`,
      journeyBriefActiveQuiet: (forecast: string) =>
        `No spend logged today yet. Based on current records, the full trip is forecast at ${forecast}.`,
      journeyBudgetBriefActiveQuiet: (runway: string, result: string) =>
        `No spend logged today yet. Today's guide is ${runway}; ${result}.`,
      journeyBriefComplete: (pace: string) =>
        `Trip complete. Final daily average was ${pace}.`,
      journeyBudgetBriefComplete: (delta: string) => `Trip complete. ${delta}.`,
      addTodayExpense: "Log today's spend",
      reviewTodayExpenses: "Review today",
      averageDaily: "Daily average",
      expenseDayAverage: "Expense-day average",
      largestExpense: "Largest expense",
      categoryBreakdown: "Category breakdown",
      categoryBars: "Bars",
      categoryDonut: "Donut",
      categoryViewAria: "Switch category breakdown view",
      categoryDonutAria: "Category share donut chart",
      dailyTrend: "Daily trend",
      previousTrendPage: "Previous dates",
      nextTrendPage: "Next dates",
      dailyTrendPage: (page: number, total: number) =>
        `Page ${page} of ${total}`,
      topCategory: "Top category",
      ledgerFocus: "Ledger focus",
      focusedCategory: (category: string) => `Category: ${category}`,
      focusedDate: (date: string) => `Date: ${date}`,
      focusCategoryAria: (category: string) =>
        `Focus category in ledger: ${category}`,
      focusDateAria: (date: string) => `Focus date in ledger: ${date}`,
      clearLedgerFocus: "Clear",
      noFocusedExpenses: "No expenses match this focus.",
      exportCsv: "Export CSV",
      exportCsvAria: "Export current trip expenses as CSV",
      noAnalytics: "Add expenses to unlock trip insights.",
    },
    trip: {
      trigger: "Trip",
      newTitle: "New trip",
      description:
        "Trips are saved on this device first and synced when cloud is available.",
      editTrigger: "Edit trip",
      editTitle: "Edit trip",
      editDescription:
        "Trip changes are saved locally first and synced when cloud is available.",
      name: "Trip name",
      namePlaceholder: "Lisbon work week…",
      destination: "Destination",
      destinationPlaceholder: "Lisbon, Porto…",
      start: "Start",
      end: "End",
      baseCurrency: "Base currency",
      create: "Create trip",
      update: "Update trip",
      budget: "Trip budget",
      budgetPlaceholder: (currency: CurrencyCode, example: string) =>
        `${example} ${currency}`,
        budgetHelper: (currency: CurrencyCode, decimals: number) =>
          decimals === 0
            ? `Optional. Used for the daily guide and budget left. ${currency} accepts whole amounts only.`
            : `Optional. Used for the daily guide and budget left. Up to ${decimals} decimal places.`,
      createFailed: "Trip could not be saved.",
      updateFailed: "Trip could not be updated.",
      delete: "Delete trip",
      deleteAria: "Delete current trip",
      deleteConfirmTitle: "Delete this trip and its expenses?",
      deleteConfirmDescription:
        "All expenses in this trip will be removed. The deletion syncs when cloud is available.",
      confirmDelete: "Delete trip",
      cancelDelete: "Cancel",
      deleteFailed: "Trip could not be deleted.",
    },
    expense: {
      trigger: "Add expense",
      newTitle: "New expense",
      description: "Saved locally first; synced to Supabase when available.",
      editTrigger: "Edit expense",
      editTitle: "Edit expense",
      editDescription:
        "Updates are saved locally first and synced when cloud is available.",
      amount: "Amount",
      amountPlaceholder: (currency: CurrencyCode, example: string) =>
        `${example} ${currency}`,
      amountHelper: (currency: CurrencyCode, decimals: number) =>
        decimals === 0
          ? `${currency} uses whole amounts only.`
          : `${currency} supports up to ${decimals} decimal places.`,
      amountPreview: "Preview",
      currency: "Currency",
      date: "Date",
      dateRangeHelper: (range: string) => `Allowed dates: ${range}`,
      rate: "Rate",
      category: "Category",
      note: "Note",
      notePlaceholder: "Airport taxi…",
      save: "Save expense",
      update: "Update expense",
      saveFailed: "Expense could not be saved.",
      updateFailed: "Expense could not be updated.",
      selectTripFirst: "Select a trip before adding an expense.",
      delete: "Delete expense",
      deleteAria: "Delete expense",
      deleteConfirmTitle: "Delete this expense?",
      deleteConfirmDescription:
        "This removes the expense from the trip and syncs the deletion when cloud is available.",
      confirmDelete: "Delete",
      cancelDelete: "Cancel",
      deleteFailed: "Expense could not be deleted.",
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
      "Use a valid budget": "Use a valid budget",
      "Budget must be greater than zero": "Budget must be greater than zero",
      "Budget currency does not support decimal amounts":
        "This budget currency does not support decimal amounts",
      "Too many decimal places for budget currency":
        "Too many decimal places for this budget currency",
      "Use a valid amount": "Use a valid amount",
      "Amount must be greater than zero": "Amount must be greater than zero",
      "Currency does not support decimal amounts":
        "This currency does not support decimal amounts",
      "Too many decimal places for currency":
        "Too many decimal places for this currency",
      "Use a valid rate": "Use a valid rate",
      "Use a valid date": "Use a valid date",
      "Expense date must be within trip dates":
        "Expense date must stay within the trip dates. Edit the trip dates to backfill it.",
      "Trip dates must include existing expenses":
        "Trip dates must include existing expenses. Move or delete out-of-range expenses first.",
    },
  },
  zh: {
    languageName: "中文",
    switchLanguage: "EN",
    switchLanguageAria: "切换为英文",
    localeCode: "zh-CN",
    appName: "FareFlow",
    tagline: "旅行支出账本",
    common: {
      backToApp: "返回 FareFlow",
      notSet: "未设置",
      saving: "保存中…",
      retry: "重试",
      reload: "重新加载",
      close: "关闭",
    },
    recovery: {
      offlineTitle: "FareFlow 当前离线",
      offlineDescription:
        "已缓存的旅程和待同步支出会保留在本机；网络恢复后将继续同步到 Supabase。",
      offlineAction: "返回账本",
      loadingTitle: "正在准备你的旅行账本",
      loadingDescription: "FareFlow 正在检查本机记录和同步状态。",
      notFoundTitle: "这页不在行程里",
      notFoundDescription: "页面可能已移动，或这个链接已经失效。",
      appErrorTitle: "FareFlow 遇到可恢复错误",
      appErrorDescription:
        "本机记录仍保留在设备上。你可以重试当前视图，或返回账本。",
      queryErrorTitle: "无法载入最新记录",
      queryErrorDescription: "请检查网络或 Supabase 状态，然后重试。",
      storageErrorTitle: "离线存储不可用",
      storageErrorDescription:
        "FareFlow 需要 IndexedDB 才能离线记录。请开启浏览器存储，或在普通浏览会话中重试。",
    },
    auth: {
      label: "邮箱登录链接",
      placeholder: "you@example.com",
      send: "发送登录链接",
      sent: "登录链接已发送，请检查邮箱。",
      recentLink: "新的登录链接已经发出，请使用邮箱里的最新邮件；倒计时结束后可重新发送。",
      fallbackError: "登录链接发送失败。",
      rateLimit: "邮件服务正在冷却，请先使用最新登录邮件，稍后可重新发送。",
      retryAfter: (seconds: number) => `${seconds} 秒后可重新发送`,
      localDemo: "本地模式",
      localDemoDescription:
        "配置 Supabase 后可启用登录、RLS 和云端同步。",
      cloudReady: "云端已连接",
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
      pendingCount: (count: number) => `${count} 项待同步`,
      failedCount: (count: number) => `${count} 项失败`,
      retryFailed: "重试同步",
      retryFailedAria: "重试同步失败项",
      status: {
        pending: "待同步",
        syncing: "同步中",
        synced: "已同步",
        failed: "失败",
      },
    },
    home: {
      currentJourney: "当前旅程",
      actionCenter: "当前旅程概览",
      firstTripTitle: "创建第一段旅程",
      createTripPrompt: "创建旅程后即可开始记录旅行支出。",
      selectTrip: "选择旅程",
      tripTotal: "旅程总额",
      todaySpend: "今日支出",
      budgetRemaining: "预算剩余",
      budgetTotal: "总预算",
      budgetSpentOver: "已超支",
      budgetPlaceholder: "未设置",
      budgetAutopilot: "预算节奏",
      budgetRunway: "今日建议",
      budgetLeft: "预算剩余",
      budgetBuffer: "今日剩余",
      budgetOverrun: "今日超出",
      budgetUnsetPrompt: "设置旅程预算后，可计算每日建议额度和预算剩余。",
      budgetOnTrack: "预算正常",
      budgetWatch: "今日需收紧",
      budgetOver: "已超总预算",
      tripDays: "旅程天数",
      expenseDays: "记账天数",
      categoriesTracked: "已用分类",
      noTripSelected: "尚未选择旅程",
      quickCapture: "随手记",
      quickCaptureBadge: "离线可用",
      quickCaptureSample: "打车 68 今天",
      quickCaptureEmptyTitle: "先选择一段旅程",
      quickCaptureEmptyDescription:
        "选择旅程后，可直接用一句话记录支出，无需打开完整表单。",
      quickCaptureDescription:
        "输入金额、分类和日期，确认后直接写入本地账本。",
      quickCapturePlaceholder: (currency: CurrencyCode) =>
        `例如：打车 68 ${currency} 今天`,
      quickCaptureExamples: (currency: CurrencyCode) => [
        `打车 68 ${currency} 今天`,
        "拉面 1800 JPY 昨天",
        `门票 120 ${currency}`,
      ],
      quickCaptureIdle: "输入后会显示金额、分类和日期。",
      quickCapturePreview: "识别结果",
      quickCaptureAmount: "金额",
      quickCaptureCategory: "分类",
      quickCaptureDate: "日期",
      quickCaptureNote: "备注",
      quickCaptureRate: "折算汇率",
      quickCaptureRateHelper: (
        currency: CurrencyCode,
        baseCurrency: CurrencyCode,
      ) => `1 ${currency} 可折算为多少 ${baseCurrency}`,
      quickCaptureMissingAmount: "请补充金额",
      quickCaptureOutOfRange: "日期不在当前旅程内",
      quickCaptureSave: "确认入账",
      quickCaptureSaved: (amount: string) => `已入账 ${amount}`,
      quickCaptureFailed: "这笔支出保存失败，请稍后重试。",
      quickCaptureNoNote: "未填写备注",
      quickCaptureReady: "可入账",
      quickCaptureNeedsRate: "需补汇率",
      items: "笔数",
      pending: "待同步",
      noExpensesTitle: "还没有支出",
      noExpensesDescription: "登机前、转场中或抵达后，都可以先记录第一笔花费。",
      expenses: "支出记录",
      recentExpenses: "最近支出",
      itemCount: (count: number) => `${count} 笔`,
      allExpenses: "全部",
      expenseFilterAria: "筛选支出记录",
      tripList: "已保存旅程",
      tripState: "旅程状态",
      destination: "目的地",
      baseCurrency: "基准货币",
      currentTotal: "当前总额",
      pendingSync: "待同步",
      dashboard: "数据看板",
      journeyRhythm: "花费节奏",
      routeProgress: "行程进度",
      remainingDays: "剩余天数",
      journeyUpcoming: "准备中",
      journeyActive: "行程中",
      journeyComplete: "已完成",
      noRhythm: "创建旅程后可查看花费节奏。",
      todayRhythmBrief: "今日简报",
      paceForecast: "预计总额",
      loggedCoverage: "记账覆盖",
      journeyDay: (current: number, total: number) =>
        current > 0 ? `第 ${current}/${total} 天` : `${total} 天行程`,
      journeyBriefUpcoming: (days: number) =>
        `还有 ${days} 天出发。先建好旅程，开始记账后会显示花费节奏。`,
      journeyBudgetBriefUpcoming: (budget: string, runway: string) =>
        `总预算 ${budget} 已设置，日均参考约 ${runway}。`,
      journeyBriefActiveEmpty: (day: number, total: number) =>
        `今天是第 ${day}/${total} 天，还没有支出记录。记一笔后即可查看今日花费。`,
      journeyBudgetBriefActiveEmpty: (
        day: number,
        total: number,
        runway: string,
      ) =>
        `今天是第 ${day}/${total} 天。按今天开始前的剩余预算计算，今日建议约 ${runway}。`,
      journeyBriefActiveToday: (today: string, forecast: string) =>
        `今天已记录 ${today}。按当前记录估算，全程支出约 ${forecast}。`,
      journeyBudgetBriefActiveToday: (
        today: string,
        runway: string,
        delta: string,
      ) =>
        `今天已记录 ${today}。今日建议 ${runway}，${delta}。`,
      journeyBriefActiveQuiet: (forecast: string) =>
        `今天还没有新支出。按当前记录估算，全程支出约 ${forecast}。`,
      journeyBudgetBriefActiveQuiet: (runway: string, result: string) =>
        `今天还没有新支出。今日建议 ${runway}，当前总预算${result}。`,
      journeyBriefComplete: (pace: string) =>
        `旅程已完成，日均支出 ${pace}。`,
      journeyBudgetBriefComplete: (delta: string) => `旅程已完成，${delta}。`,
      addTodayExpense: "记今日支出",
      reviewTodayExpenses: "查看今日记录",
      averageDaily: "日均支出",
      expenseDayAverage: "记账日均",
      largestExpense: "最大单笔",
      categoryBreakdown: "分类占比",
      categoryBars: "条形",
      categoryDonut: "圆环",
      categoryViewAria: "切换分类占比视图",
      categoryDonutAria: "分类占比圆环图",
      dailyTrend: "每日走势",
      previousTrendPage: "上一段日期",
      nextTrendPage: "下一段日期",
      dailyTrendPage: (page: number, total: number) =>
        `第 ${page}/${total} 段`,
      topCategory: "最高分类",
      ledgerFocus: "账本聚焦",
      focusedCategory: (category: string) => `分类：${category}`,
      focusedDate: (date: string) => `日期：${date}`,
      focusCategoryAria: (category: string) =>
        `在账本中聚焦分类：${category}`,
      focusDateAria: (date: string) => `在账本中聚焦日期：${date}`,
      clearLedgerFocus: "清除",
      noFocusedExpenses: "当前聚焦下没有支出。",
      exportCsv: "导出 CSV",
      exportCsvAria: "导出当前旅程支出 CSV",
      noAnalytics: "记录支出后即可查看旅程洞察。",
    },
    trip: {
      trigger: "旅程",
      newTitle: "新建旅程",
      description: "旅程会先保存到本机，网络可用时同步到云端。",
      editTrigger: "编辑旅程",
      editTitle: "编辑旅程",
      editDescription: "修改会先保存到本机，网络可用时同步到云端。",
      name: "旅程名称",
      namePlaceholder: "里斯本工作周…",
      destination: "目的地",
      destinationPlaceholder: "里斯本、波尔图…",
      start: "开始",
      end: "结束",
      baseCurrency: "基准货币",
      create: "创建旅程",
      update: "更新旅程",
      budget: "旅程预算",
      budgetPlaceholder: (currency: CurrencyCode, example: string) =>
        `${example} ${currency}`,
        budgetHelper: (currency: CurrencyCode, decimals: number) =>
          decimals === 0
            ? `可选，用于计算每日建议和预算剩余。${currency} 仅支持整数金额。`
            : `可选，用于计算每日建议和预算剩余，最多 ${decimals} 位小数。`,
      createFailed: "旅程保存失败。",
      updateFailed: "旅程更新失败。",
      delete: "删除旅程",
      deleteAria: "删除当前旅程",
      deleteConfirmTitle: "删除这个旅程及其支出？",
      deleteConfirmDescription:
        "该旅程中的所有支出都会被删除，网络可用时同步到云端。",
      confirmDelete: "删除旅程",
      cancelDelete: "取消",
      deleteFailed: "旅程删除失败。",
    },
    expense: {
      trigger: "添加支出",
      newTitle: "新增支出",
      description: "支出会先保存到本机，网络可用时同步到 Supabase。",
      editTrigger: "编辑支出",
      editTitle: "编辑支出",
      editDescription: "修改会先保存到本机，网络可用时同步到云端。",
      amount: "金额",
      amountPlaceholder: (currency: CurrencyCode, example: string) =>
        `${example} ${currency}`,
      amountHelper: (currency: CurrencyCode, decimals: number) =>
        decimals === 0
          ? `${currency} 只能输入整数金额。`
          : `${currency} 最多支持 ${decimals} 位小数。`,
      amountPreview: "预览",
      currency: "币种",
      date: "日期",
      dateRangeHelper: (range: string) => `可记账日期：${range}`,
      rate: "汇率",
      category: "分类",
      note: "备注",
      notePlaceholder: "机场出租车…",
      save: "保存支出",
      update: "更新支出",
      saveFailed: "支出保存失败。",
      updateFailed: "支出更新失败。",
      selectTripFirst: "请先选择一个旅程。",
      delete: "删除支出",
      deleteAria: "删除支出",
      deleteConfirmTitle: "删除这笔支出？",
      deleteConfirmDescription:
        "这会从当前旅程移除该支出，网络可用时同步到云端。",
      confirmDelete: "删除",
      cancelDelete: "取消",
      deleteFailed: "支出删除失败。",
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
      "Use a valid budget": "请输入有效预算",
      "Budget must be greater than zero": "预算必须大于 0",
      "Budget currency does not support decimal amounts": "该预算币种不支持小数金额",
      "Too many decimal places for budget currency": "该预算币种的小数位数过多",
      "Use a valid amount": "请输入有效金额",
      "Amount must be greater than zero": "金额必须大于 0",
      "Currency does not support decimal amounts": "该币种不支持小数金额",
      "Too many decimal places for currency": "该币种的小数位数过多",
      "Use a valid rate": "请输入有效汇率",
      "Use a valid date": "请选择有效日期",
      "Expense date must be within trip dates":
        "支出日期需在旅程日期内；如需补记，请先编辑旅程时间。",
      "Trip dates must include existing expenses":
        "旅程时间需包含已有支出；如需缩短旅程，请先调整或删除超出范围的支出。",
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
