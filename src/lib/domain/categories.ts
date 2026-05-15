import {
  Banknote,
  BedDouble,
  HeartPulse,
  Landmark,
  ShoppingBag,
  Soup,
  TrainFront,
  type LucideIcon,
} from "lucide-react";
import type { ExpenseCategory } from "@/lib/domain/schema";

export const categoryMeta = {
  food: {
    label: "Food",
    icon: Soup,
    tone: "bg-tomato-100 text-tomato-900",
    chartTone: "bg-tomato-900",
    chartColor: "var(--tomato-900)",
  },
  transport: {
    label: "Transport",
    icon: TrainFront,
    tone: "bg-rail-100 text-rail-900",
    chartTone: "bg-rail-900",
    chartColor: "var(--rail-900)",
  },
  lodging: {
    label: "Lodging",
    icon: BedDouble,
    tone: "bg-canvas-strong text-ink",
    chartTone: "bg-ink",
    chartColor: "var(--ink)",
  },
  sights: {
    label: "Sights",
    icon: Landmark,
    tone: "bg-passport-100 text-passport-900",
    chartTone: "bg-passport-900",
    chartColor: "var(--passport-900)",
  },
  shopping: {
    label: "Shopping",
    icon: ShoppingBag,
    tone: "bg-mint-100 text-mint-900",
    chartTone: "bg-mint-900",
    chartColor: "var(--mint-900)",
  },
  health: {
    label: "Health",
    icon: HeartPulse,
    tone: "bg-berry-100 text-berry-900",
    chartTone: "bg-berry-900",
    chartColor: "var(--berry-900)",
  },
  other: {
    label: "Other",
    icon: Banknote,
    tone: "bg-stamp-100 text-stamp-900",
    chartTone: "bg-stamp-900",
    chartColor: "var(--stamp-900)",
  },
} satisfies Record<
  ExpenseCategory,
  {
    label: string;
    icon: LucideIcon;
    tone: string;
    chartTone: string;
    chartColor: string;
  }
>;
