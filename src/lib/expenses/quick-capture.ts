import { parseMajorToMinor } from "@/lib/domain/money";
import {
  currencyCodes,
  expenseCategories,
  type CurrencyCode,
  type ExpenseCategory,
  type Trip,
} from "@/lib/domain/schema";
import { getDefaultExpenseDate, isDateInTripRange } from "@/lib/domain/trip-dates";

export type QuickCaptureIssue = "amount" | "date";

export type QuickCaptureParseResult = {
  amountMajor: string | null;
  amountMinor: number | null;
  currency: CurrencyCode;
  category: ExpenseCategory;
  expenseDate: string;
  note: string;
  issues: QuickCaptureIssue[];
  isReady: boolean;
};

const quickCaptureCategoryKeywords = {
  food: [
    "餐",
    "饭",
    "早餐",
    "午餐",
    "晚餐",
    "咖啡",
    "奶茶",
    "拉面",
    "寿司",
    "食物",
    "吃",
    "food",
    "meal",
    "coffee",
    "ramen",
    "restaurant",
  ],
  transport: [
    "交通",
    "打车",
    "出租",
    "地铁",
    "公交",
    "巴士",
    "高铁",
    "火车",
    "机票",
    "taxi",
    "uber",
    "metro",
    "bus",
    "train",
    "flight",
  ],
  lodging: [
    "住宿",
    "酒店",
    "旅馆",
    "民宿",
    "hotel",
    "hostel",
    "lodging",
    "airbnb",
  ],
  sights: [
    "景点",
    "门票",
    "博物馆",
    "展览",
    "公园",
    "ticket",
    "museum",
    "sight",
    "gallery",
  ],
  shopping: [
    "购物",
    "手信",
    "礼物",
    "商场",
    "超市",
    "shopping",
    "gift",
    "market",
  ],
  health: [
    "药",
    "药店",
    "医院",
    "医疗",
    "保险",
    "pharmacy",
    "health",
    "clinic",
    "medicine",
  ],
  other: ["其他", "杂项", "other"],
} satisfies Record<ExpenseCategory, string[]>;

export function parseQuickCaptureDraft(
  draft: string,
  trip: Trip | null,
  todayDate: string,
): QuickCaptureParseResult | null {
  if (!trip) {
    return null;
  }

  const normalized = normalizeQuickCaptureText(draft);
  const currency = detectQuickCaptureCurrency(normalized, trip.baseCurrency);
  const amountMajor = detectQuickCaptureAmount(normalized);
  let amountMinor: number | null = null;
  const issues: QuickCaptureIssue[] = [];

  if (!amountMajor) {
    issues.push("amount");
  } else {
    try {
      amountMinor = parseMajorToMinor(amountMajor, currency);
    } catch {
      issues.push("amount");
    }
  }

  const expenseDate = detectQuickCaptureDate(normalized, trip, todayDate);
  if (!isDateInTripRange(expenseDate, trip)) {
    issues.push("date");
  }

  const category = detectQuickCaptureCategory(normalized);
  const note = buildQuickCaptureNote(normalized, amountMajor);

  return {
    amountMajor,
    amountMinor,
    currency,
    category,
    expenseDate,
    note,
    issues,
    isReady: issues.length === 0,
  };
}

export function isValidQuickCaptureRate(value: string) {
  const normalized = value.trim();
  return /^\d+(\.\d{1,8})?$/.test(normalized) && Number(normalized) > 0;
}

function normalizeQuickCaptureText(value: string) {
  return value
    .replace(/[０-９]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0xfee0),
    )
    .replace(/[，]/g, ",")
    .replace(/[。]/g, ".")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .trim();
}

function detectQuickCaptureAmount(value: string) {
  const source = stripQuickCaptureDateTokens(value);
  const match = source.match(/(?:[$€£¥฿]\s*)?(\d+(?:\.\d+)?)/);
  return match?.[1] ?? null;
}

function detectQuickCaptureCurrency(
  value: string,
  baseCurrency: CurrencyCode,
): CurrencyCode {
  const upperValue = value.toUpperCase();
  const explicitCode = currencyCodes.find((currency) =>
    new RegExp(`\\b${currency}\\b`).test(upperValue),
  );

  if (explicitCode) {
    return explicitCode;
  }

  if (/日元|円|YEN/i.test(value)) {
    return "JPY";
  }

  if (/人民币|RMB|元|块/i.test(value)) {
    return baseCurrency === "JPY" ? "JPY" : "CNY";
  }

  if (/美元|美金/i.test(value)) {
    return "USD";
  }

  if (/欧元/i.test(value)) {
    return "EUR";
  }

  if (/英镑/i.test(value)) {
    return "GBP";
  }

  if (/泰铢|BAHT/i.test(value)) {
    return "THB";
  }

  if (/新币|新加坡元/i.test(value)) {
    return "SGD";
  }

  if (/澳元/i.test(value)) {
    return "AUD";
  }

  if (value.includes("€")) {
    return "EUR";
  }

  if (value.includes("£")) {
    return "GBP";
  }

  if (value.includes("฿")) {
    return "THB";
  }

  if (value.includes("¥")) {
    return baseCurrency === "JPY" || baseCurrency === "CNY"
      ? baseCurrency
      : "CNY";
  }

  if (value.includes("$")) {
    return ["USD", "SGD", "AUD"].includes(baseCurrency)
      ? baseCurrency
      : "USD";
  }

  return baseCurrency;
}

function detectQuickCaptureCategory(value: string): ExpenseCategory {
  const lowerValue = value.toLowerCase();

  for (const category of expenseCategories) {
    if (category === "other") {
      continue;
    }

    if (
      quickCaptureCategoryKeywords[category].some((keyword) =>
        lowerValue.includes(keyword.toLowerCase()),
      )
    ) {
      return category;
    }
  }

  return "other";
}

function detectQuickCaptureDate(
  value: string,
  trip: Trip,
  todayDate: string,
) {
  const lowerValue = value.toLowerCase();

  if (/前天|day before yesterday/.test(lowerValue)) {
    return toDateInput(addDays(dateFromInput(todayDate), -2));
  }

  if (/昨天|昨日|yesterday/.test(lowerValue)) {
    return toDateInput(addDays(dateFromInput(todayDate), -1));
  }

  if (/今天|今日|today/.test(lowerValue)) {
    return todayDate;
  }

  const isoMatch = value.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    return formatLooseDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );
  }

  const monthDayMatch = value.match(/(?:^|\s)(\d{1,2})[./月-](\d{1,2})日?(?=\s|$)/);
  if (monthDayMatch) {
    return formatLooseDate(
      dateFromInput(todayDate).getFullYear(),
      Number(monthDayMatch[1]),
      Number(monthDayMatch[2]),
    );
  }

  return getDefaultExpenseDate(trip);
}

function formatLooseDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function buildQuickCaptureNote(value: string, amountMajor: string | null) {
  let note = stripQuickCaptureDateTokens(value);

  if (amountMajor) {
    note = note.replace(new RegExp(escapeRegExp(amountMajor), "g"), " ");
  }

  note = note.replace(/\b(USD|EUR|GBP|JPY|CNY|THB|SGD|AUD)\b/gi, " ");
  note = note.replace(/[¥$€£฿]/g, " ");
  note = note.replace(
    /人民币|RMB|日元|円|YEN|美元|美金|欧元|英镑|泰铢|BAHT|新币|新加坡元|澳元|元|块/gi,
    " ",
  );

  note = cleanQuickCapturePhrase(note);

  return note.slice(0, 180);
}

function cleanQuickCapturePhrase(value: string) {
  let phrase = value
    .replace(/[，,。.!！?？、；;:：]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  phrase = phrase.replace(
    /^(?:一共|总共|总计|合计|大概|大约|约|差不多|花了?|花费|消费|支付|付了?|付款|支出|用了?|用掉|买了?|购买|购入|吃了?|喝了?)\s*/i,
    "",
  );
  phrase = phrase.replace(
    /\s*(?:一共|总共|总计|合计|大概|大约|约|差不多|花了?|花费|消费|支付|付了?|付款|支出|用了?|用掉|买了?|购买|购入|cost|costs|spent|paid|pay|for|on)\s*$/i,
    "",
  );
  phrase = phrase.replace(
    /\s*(?:一共|总共|总计|合计|花了?|花费|消费|支付|付了?|付款|支出|用了?|用掉)\s*/gi,
    " ",
  );
  phrase = phrase.replace(
    /^(?:去(?:了)?|到|在|买了?|购买|购入|吃了?|喝了?)\s*/i,
    "",
  );
  phrase = phrase.replace(/\s+(?:cost|costs|spent|paid|pay|for|on)\s+/gi, " ");
  phrase = phrase.replace(/^(?:spent|paid|pay|cost|costs|for|on)\s+/i, "");
  phrase = phrase.replace(/\s+(?:spent|paid|pay|cost|costs|for|on)$/i, "");
  phrase = phrase.replace(/ktv/gi, "KTV");

  return phrase.replace(/\s+/g, " ").trim();
}

function stripQuickCaptureDateTokens(value: string) {
  return value
    .replace(/\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/g, " ")
    .replace(/(?:^|\s)\d{1,2}[./月-]\d{1,2}日?(?=\s|$)/g, " ")
    .replace(/今天|今日|昨天|昨日|前天|today|yesterday|day before yesterday/gi, " ");
}

function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00+08:00`);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateInput(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  });
  return formatter.format(date);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
