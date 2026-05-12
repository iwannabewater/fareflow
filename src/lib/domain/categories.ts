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
  food: { label: "Food", icon: Soup, tone: "bg-tomato-100 text-tomato-900" },
  transport: {
    label: "Transport",
    icon: TrainFront,
    tone: "bg-rail-100 text-rail-900",
  },
  lodging: {
    label: "Lodging",
    icon: BedDouble,
    tone: "bg-canvas-strong text-ink",
  },
  sights: {
    label: "Sights",
    icon: Landmark,
    tone: "bg-passport-100 text-passport-900",
  },
  shopping: {
    label: "Shopping",
    icon: ShoppingBag,
    tone: "bg-mint-100 text-mint-900",
  },
  health: {
    label: "Health",
    icon: HeartPulse,
    tone: "bg-rose-100 text-rose-900",
  },
  other: {
    label: "Other",
    icon: Banknote,
    tone: "bg-stamp-100 text-stamp-900",
  },
} satisfies Record<
  ExpenseCategory,
  { label: string; icon: LucideIcon; tone: string }
>;

