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

type QuickCaptureAmountEntity = {
  amountMajor: string;
  start: number;
  end: number;
  score: number;
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
    "食堂",
    "饺子",
    "包子",
    "饮料",
    "水",
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
    "机场",
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
    "便利店",
    "shopping",
    "gift",
    "market",
  ],
  health: [
    "药",
    "药店",
    "医院",
    "诊所",
    "看病",
    "挂号",
    "问诊",
    "检查",
    "体检",
    "医疗",
    "保险",
    "pharmacy",
    "health",
    "clinic",
    "medicine",
  ],
  other: ["其他", "杂项", "other"],
} satisfies Record<ExpenseCategory, string[]>;

const quickCaptureAmountNumberPattern = "\\d+(?:\\.\\d+)?";
const quickCaptureChineseNumberPattern = "[零〇一二两三四五六七八九十百千万]+(?:点[零〇一二三四五六七八九]+)?";
const quickCaptureCurrencyPattern =
  "(?:人民币|RMB|日元|円|YEN|美元|美金|欧元|英镑|泰铢|BAHT|新币|新加坡元|澳元|USD|EUR|GBP|JPY|CNY|THB|SGD|AUD|元钱?|块钱?|块)";
const quickCaptureSpendVerbPattern =
  "(?:一共|总共|总计|合计|大概|大约|约|差不多|花了?|花费|消费|支付|付了?|付款|支出|用了?|用掉|costs?|spent|paid|pay)";
const quickCaptureQuantityUnitPattern =
  "(?:个人|人|位|份|杯|碗|个|件|张|瓶|盒|客|晚|次|天|小时|公里|km|KM)";
const quickCaptureNoteSeparator = " · ";
const quickCaptureNoteSegmentPrefixes = [
  "7-11",
  "711",
  "KTV",
  "食堂",
  "酒店",
  "旅馆",
  "民宿",
  "医院",
  "药店",
  "诊所",
  "超市",
  "便利店",
  "商场",
] as const;

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
  const amountEntity = detectQuickCaptureAmountEntity(normalized);
  const amountMajor = amountEntity?.amountMajor ?? null;
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
  const note = buildQuickCaptureNote(normalized, amountEntity);

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
    .replace(/[￥]/g, "¥")
    .replace(/[＄]/g, "$")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .trim();
}

function detectQuickCaptureAmountEntity(value: string): QuickCaptureAmountEntity | null {
  const candidates: QuickCaptureAmountEntity[] = [];
  const dateSpans = collectQuickCaptureDateSpans(value);

  collectRegexAmountCandidates(
    value,
    new RegExp(
      `[¥$€£฿]\\s*(${quickCaptureAmountNumberPattern})\\s*${quickCaptureCurrencyPattern}?`,
      "gi",
    ),
    candidates,
    dateSpans,
    150,
  );
  collectRegexAmountCandidates(
    value,
    new RegExp(
      `${quickCaptureCurrencyPattern}\\s*(${quickCaptureAmountNumberPattern})`,
      "gi",
    ),
    candidates,
    dateSpans,
    150,
  );
  collectRegexAmountCandidates(
    value,
    new RegExp(
      `${quickCaptureSpendVerbPattern}\\s*(${quickCaptureAmountNumberPattern})\\s*${quickCaptureCurrencyPattern}?`,
      "gi",
    ),
    candidates,
    dateSpans,
    145,
  );
  collectRegexAmountCandidates(
    value,
    new RegExp(`(${quickCaptureAmountNumberPattern})\\s*${quickCaptureCurrencyPattern}`, "gi"),
    candidates,
    dateSpans,
    135,
  );
  collectRegexAmountCandidates(
    value,
    new RegExp(`\\b(?:USD|EUR|GBP|JPY|CNY|THB|SGD|AUD)\\s*(${quickCaptureAmountNumberPattern})`, "gi"),
    candidates,
    dateSpans,
    130,
  );
  collectChineseAmountCandidates(value, candidates, dateSpans);
  collectColloquialDecimalAmountCandidates(value, candidates, dateSpans);
  collectBareNumberAmountCandidates(value, candidates, dateSpans);

  return candidates
    .sort((first, second) =>
      second.score === first.score
        ? second.end - first.end
        : second.score - first.score,
    )
    .at(0) ?? null;
}

function collectRegexAmountCandidates(
  value: string,
  regex: RegExp,
  candidates: QuickCaptureAmountEntity[],
  dateSpans: Array<[number, number]>,
  score: number,
) {
  for (const match of value.matchAll(regex)) {
    const rawAmount = match[1];
    if (!rawAmount || match.index === undefined) {
      continue;
    }

    const amountStart = match.index + match[0].indexOf(rawAmount);
    const amountEnd = amountStart + rawAmount.length;
    if (isWithinAnySpan(amountStart, amountEnd, dateSpans)) {
      continue;
    }

    candidates.push({
      amountMajor: normalizeQuickCaptureAmountMajor(rawAmount),
      start: match.index,
      end: match.index + match[0].length,
      score: score + scoreQuickCaptureAmountContext(value, amountStart, amountEnd),
    });
  }
}

function collectChineseAmountCandidates(
  value: string,
  candidates: QuickCaptureAmountEntity[],
  dateSpans: Array<[number, number]>,
) {
  const colloquialDecimalRegex = new RegExp(
    `(${quickCaptureChineseNumberPattern})(?:块|元)([零〇一二三四五六七八九])(?:角|毛|钱)?`,
    "g",
  );
  for (const match of value.matchAll(colloquialDecimalRegex)) {
    if (!match[1] || !match[2] || match.index === undefined) {
      continue;
    }

    const amountMajor = parseQuickCaptureChineseNumber(match[1]);
    const decimalDigit = parseQuickCaptureChineseNumber(match[2]);
    if (amountMajor === null || decimalDigit === null) {
      continue;
    }

    const end = match.index + match[0].length;
    if (isWithinAnySpan(match.index, end, dateSpans)) {
      continue;
    }

    candidates.push({
      amountMajor: `${amountMajor}.${decimalDigit}`,
      start: match.index,
      end,
      score: 170 + scoreQuickCaptureAmountContext(value, match.index, end),
    });
  }

  const chineseCurrencyRegex = new RegExp(
    `(${quickCaptureChineseNumberPattern})\\s*${quickCaptureCurrencyPattern}`,
    "g",
  );
  for (const match of value.matchAll(chineseCurrencyRegex)) {
    const rawAmount = match[1];
    if (!rawAmount || match.index === undefined) {
      continue;
    }

    const amountMajor = parseQuickCaptureChineseNumber(rawAmount);
    if (amountMajor === null) {
      continue;
    }

    const end = match.index + match[0].length;
    if (isWithinAnySpan(match.index, end, dateSpans)) {
      continue;
    }

    candidates.push({
      amountMajor: String(amountMajor),
      start: match.index,
      end,
      score: 155 + scoreQuickCaptureAmountContext(value, match.index, end),
    });
  }
}

function collectColloquialDecimalAmountCandidates(
  value: string,
  candidates: QuickCaptureAmountEntity[],
  dateSpans: Array<[number, number]>,
) {
  const regex = /(\d+)(?:块|元)([0-9零〇一二三四五六七八九])(?:角|毛|钱)?/g;
  for (const match of value.matchAll(regex)) {
    if (!match[1] || !match[2] || match.index === undefined) {
      continue;
    }

    const decimalDigit =
      /^\d$/.test(match[2]) ? Number(match[2]) : quickCaptureChineseDigitMap[match[2]];
    if (decimalDigit === undefined) {
      continue;
    }

    const end = match.index + match[0].length;
    if (isWithinAnySpan(match.index, end, dateSpans)) {
      continue;
    }

    candidates.push({
      amountMajor: `${normalizeQuickCaptureAmountMajor(match[1])}.${decimalDigit}`,
      start: match.index,
      end,
      score: 170 + scoreQuickCaptureAmountContext(value, match.index, end),
    });
  }
}

function collectBareNumberAmountCandidates(
  value: string,
  candidates: QuickCaptureAmountEntity[],
  dateSpans: Array<[number, number]>,
) {
  const regex = new RegExp(quickCaptureAmountNumberPattern, "g");
  for (const match of value.matchAll(regex)) {
    const rawAmount = match[0];
    if (match.index === undefined) {
      continue;
    }

    const start = match.index;
    const end = start + rawAmount.length;
    if (isWithinAnySpan(start, end, dateSpans)) {
      continue;
    }

    const quantityPenalty = isQuickCaptureQuantityNumber(value, end) ? -120 : 0;
    candidates.push({
      amountMajor: normalizeQuickCaptureAmountMajor(rawAmount),
      start,
      end,
      score:
        40 +
        quantityPenalty +
        scoreQuickCaptureAmountContext(value, start, end) +
        end / 1000,
    });
  }
}

function scoreQuickCaptureAmountContext(value: string, start: number, end: number) {
  const before = value.slice(Math.max(0, start - 8), start);
  const after = value.slice(end, Math.min(value.length, end + 8));
  let score = 0;

  if (new RegExp(`${quickCaptureSpendVerbPattern}\\s*$`, "i").test(before)) {
    score += 25;
  }
  if (new RegExp(`^\\s*${quickCaptureCurrencyPattern}`, "i").test(after)) {
    score += 20;
  }
  if (/[¥$€£฿]\s*$/.test(before)) {
    score += 20;
  }
  if (/[.]/.test(value.slice(start, end))) {
    score += 5;
  }

  return score;
}

function isQuickCaptureQuantityNumber(value: string, end: number) {
  return new RegExp(`^\\s*${quickCaptureQuantityUnitPattern}`).test(value.slice(end));
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

  if (/今天|今日|今晚|今早|今晨|今中午|今下午|今晚上|today|tonight/.test(lowerValue)) {
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

  const chineseDateMatch = value.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日?/);
  if (chineseDateMatch) {
    return formatLooseDate(
      Number(chineseDateMatch[1]),
      Number(chineseDateMatch[2]),
      Number(chineseDateMatch[3]),
    );
  }

  const monthDayMatch = value.match(
    /(?:^|\s)(\d{1,2})(?:[./月](\d{1,2})日?|-(\d{1,2})日)(?=\s|$)/,
  );
  if (monthDayMatch) {
    return formatLooseDate(
      dateFromInput(todayDate).getFullYear(),
      Number(monthDayMatch[1]),
      Number(monthDayMatch[2] ?? monthDayMatch[3]),
    );
  }

  return getDefaultExpenseDate(trip, todayDate);
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

function buildQuickCaptureNote(
  value: string,
  amountEntity: QuickCaptureAmountEntity | null,
) {
  let note = value;

  if (amountEntity) {
    note = [
      note.slice(0, amountEntity.start),
      " ",
      note.slice(amountEntity.end),
    ].join("");
  }

  note = stripQuickCaptureDateTokens(note);
  note = note.replace(/\b(USD|EUR|GBP|JPY|CNY|THB|SGD|AUD)\b/gi, " ");
  note = note.replace(/[¥$€£฿]/g, " ");
  note = note.replace(
    /人民币|RMB|日元|円|YEN|美元|美金|欧元|英镑|泰铢|BAHT|新币|新加坡元|澳元|元|块|钱/gi,
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

  phrase = phrase.replace(/^(?:我|我们|俺|本人|自己)\s*/i, "");
  phrase = phrase.replace(
    /^(?:刚刚|刚才|早上|上午|中午|下午|晚上|今晚|今早|今晨|今中午|今下午|今晚上)\s*/i,
    "",
  );
  phrase = phrase.replace(
    /^(?:一共|总共|总计|合计|大概|大约|约|差不多|花了?|花费|消费|支付|付了?|付款|支出|用了?|用掉|买了?|购买|购入|点了?|叫了?|吃了?|喝了?|坐了?|乘坐|搭了?|搭乘|订了?|预订)\s*/i,
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
    /^(?:去(?:了)?|到|在|买了?|购买|购入|吃了?|喝了?|订了?|预订)\s*/i,
    "",
  );
  phrase = phrase.replace(
    /(?:买了?|购买|购入|点了?|叫了?|吃了?|喝了?|坐了?|乘坐|搭了?|搭乘|订了?|预订)(?:\s*[一二两三四五六七八九十\d]+)?\s*(?:份|杯|碗|个|件|张|瓶|盒|客|人|晚)?\s*/gi,
    " ",
  );
  phrase = phrase.replace(
    new RegExp(
      `^(?:(?:[一二两三四五六七八九十\\d]+)\\s*${quickCaptureQuantityUnitPattern}\\s*)+`,
      "i",
    ),
    "",
  );
  phrase = phrase.replace(
    new RegExp(
      `(?:\\s*(?:[一二两三四五六七八九十\\d]+)\\s*${quickCaptureQuantityUnitPattern})+$`,
      "i",
    ),
    "",
  );
  phrase = phrase.replace(/\s+(?:cost|costs|spent|paid|pay|for|on)\s+/gi, " ");
  phrase = phrase.replace(/^(?:spent|paid|pay|cost|costs|for|on)\s+/i, "");
  phrase = phrase.replace(/\s+(?:spent|paid|pay|cost|costs|for|on)$/i, "");
  phrase = phrase.replace(/钱$/i, "");
  phrase = phrase.replace(/ktv/gi, "KTV");

  const compactPhrase = phrase
    .replace(/\s+/g, " ")
    .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    .trim();

  return formatQuickCaptureNoteSegments(compactPhrase);
}

function formatQuickCaptureNoteSegments(value: string) {
  const phrase = normalizeQuickCaptureNoteSeparators(value);
  if (!phrase || phrase.includes("·")) {
    return phrase;
  }

  const storeMatch = phrase.match(/^([A-Za-z0-9][A-Za-z0-9 -]{0,24})\s+([\u4e00-\u9fff].+)$/);
  if (storeMatch && /\d/.test(storeMatch[1])) {
    return `${storeMatch[1].trim()}${quickCaptureNoteSeparator}${storeMatch[2].trim()}`;
  }

  for (const prefix of quickCaptureNoteSegmentPrefixes) {
    if (phrase.startsWith(prefix) && phrase.length > prefix.length) {
      return `${prefix}${quickCaptureNoteSeparator}${phrase.slice(prefix.length).trim()}`;
    }
  }

  return phrase;
}

export function normalizeQuickCaptureNoteSeparators(value: string) {
  return value
    .replace(/\s*[•·]\s*/g, quickCaptureNoteSeparator)
    .replace(/\s+/g, " ")
    .trim();
}

function stripQuickCaptureDateTokens(value: string) {
  return value
    .replace(/\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/g, " ")
    .replace(/20\d{2}年\d{1,2}月\d{1,2}日?/g, " ")
    .replace(/(?:^|\s)\d{1,2}(?:[./月]\d{1,2}日?|-\d{1,2}日)(?=\s|$)/g, " ")
    .replace(
      /今天|今日|今晚|今早|今晨|今中午|今下午|今晚上|昨天|昨日|前天|today|tonight|yesterday|day before yesterday/gi,
      " ",
    );
}

function collectQuickCaptureDateSpans(value: string) {
  const spans: Array<[number, number]> = [];
  for (const regex of [
    /\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/g,
    /20\d{2}年\d{1,2}月\d{1,2}日?/g,
    /(?:^|\s)\d{1,2}(?:[./月]\d{1,2}日?|-\d{1,2}日)(?=\s|$)/g,
  ]) {
    for (const match of value.matchAll(regex)) {
      if (match.index !== undefined) {
        spans.push([match.index, match.index + match[0].length]);
      }
    }
  }
  return spans;
}

function isWithinAnySpan(start: number, end: number, spans: Array<[number, number]>) {
  return spans.some(([spanStart, spanEnd]) => start >= spanStart && end <= spanEnd);
}

function normalizeQuickCaptureAmountMajor(value: string) {
  const [integerPart, decimalPart] = value.replace(/,/g, "").split(".");
  const integer = integerPart.replace(/^0+(?=\d)/, "") || "0";

  return decimalPart === undefined ? integer : `${integer}.${decimalPart}`;
}

function parseQuickCaptureChineseNumber(value: string) {
  const [integerPart, decimalPart] = value.split("点");
  const integer = parseQuickCaptureChineseInteger(integerPart);
  if (integer === null) {
    return null;
  }

  if (!decimalPart) {
    return integer;
  }

  const decimalDigits = [...decimalPart].map(
    (character) => quickCaptureChineseDigitMap[character],
  );
  if (decimalDigits.some((digit) => digit === undefined)) {
    return null;
  }
  const decimal = decimalDigits.join("");

  return Number(`${integer}.${decimal}`);
}

const quickCaptureChineseDigitMap: Record<string, number> = {
  零: 0,
  "〇": 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

function parseQuickCaptureChineseInteger(value: string) {
  if (!value) {
    return null;
  }

  let result = 0;
  let section = 0;
  let number = 0;

  for (const character of value) {
    const digit = quickCaptureChineseDigitMap[character];
    if (digit !== undefined) {
      number = digit;
      continue;
    }

    if (character === "十" || character === "百" || character === "千") {
      const unit = character === "十" ? 10 : character === "百" ? 100 : 1000;
      section += (number || 1) * unit;
      number = 0;
      continue;
    }

    if (character === "万") {
      result += (section + number) * 10000;
      section = 0;
      number = 0;
      continue;
    }

    return null;
  }

  return result + section + number;
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
