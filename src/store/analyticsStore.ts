import { create } from "zustand";
import { supabase } from "../lib/supabase";
import {
  startOfMonth, endOfMonth, endOfWeek,
  format, eachWeekOfInterval, parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

export interface BlockRecord {
  id: string;
  title: string;
  type: "deep" | "shallow" | "other";
  category_id: string | null;
  start_time: string;
  end_time: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  color: string;
}

export interface WeekSummary {
  label: string;         // "Semana 1", "Semana 2", etc.
  startDate: string;     // YYYY-MM-DD
  endDate: string;
  deepWorkHours: number;
  shallowWorkHours: number;
  totalHours: number;
  topCategory: { name: string; color: string; hours: number } | null;
}

export interface DailyPoint {
  day: string;     // "Lun", "Mar", etc.
  date: string;    // YYYY-MM-DD
  deepWork: number;
  shallowWork: number;
  other: number;
}

export interface CategoryBreakdown {
  name: string;
  color: string;
  hours: number;
  percentage: number;
}

export interface MonthStats {
  deepWorkHours: number;
  shallowWorkHours: number;
  otherHours: number;
  totalHours: number;
  deepWorkDays: number;
  avgDailyDeepWork: number;
  topCategory: CategoryBreakdown | null;
  categoryBreakdown: CategoryBreakdown[];
  dailyPoints: DailyPoint[];
  weekSummaries: WeekSummary[];
  weeklyDeepWork: { week: string; hours: number }[];
}

interface AnalyticsState {
  currentMonth: Date;
  stats: MonthStats | null;
  categories: CategoryRecord[];
  isLoading: boolean;
  error: string | null;

  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  fetchMonthData: (month: Date) => Promise<void>;
}

// Compute duration in hours between two ISO timestamps
const durationHours = (start: string, end: string): number => {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, diff / (1000 * 60 * 60));
};

// Day label short
const DAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  currentMonth: new Date(),
  stats: null,
  categories: [],
  isLoading: false,
  error: null,

  goToPrevMonth: () => {
    const prev = new Date(get().currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    set({ currentMonth: prev });
    get().fetchMonthData(prev);
  },

  goToNextMonth: () => {
    const next = new Date(get().currentMonth);
    next.setMonth(next.getMonth() + 1);
    set({ currentMonth: next });
    get().fetchMonthData(next);
  },

  fetchMonthData: async (month: Date) => {
    set({ isLoading: true, error: null });
    try {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Fetch blocks and categories in parallel
      const [blocksRes, catsRes] = await Promise.all([
        supabase
          .from("calendar_blocks")
          .select("id, title, type, category_id, start_time, end_time")
          .gte("start_time", monthStart.toISOString())
          .lte("start_time", monthEnd.toISOString()),
        supabase.from("categories").select("id, name, color"),
      ]);

      if (blocksRes.error) throw blocksRes.error;
      if (catsRes.error) throw catsRes.error;

      const blocks: BlockRecord[] = blocksRes.data || [];
      const categories: CategoryRecord[] = catsRes.data || [];

      set({ categories });

      // Build category map
      const catMap = new Map<string, CategoryRecord>(categories.map((c) => [c.id, c]));

      // Aggregate totals
      let deepWorkHours = 0;
      let shallowWorkHours = 0;
      let otherHours = 0;
      const catHoursMap = new Map<string, number>();
      const dailyMap = new Map<string, { deep: number; shallow: number; other: number }>();

      for (const block of blocks) {
        const hours = durationHours(block.start_time, block.end_time);
        const dateKey = format(parseISO(block.start_time), "yyyy-MM-dd");

        if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { deep: 0, shallow: 0, other: 0 });
        const day = dailyMap.get(dateKey)!;

        if (block.type === "deep") {
          deepWorkHours += hours;
          day.deep += hours;
        } else if (block.type === "shallow") {
          shallowWorkHours += hours;
          day.shallow += hours;
        } else {
          otherHours += hours;
          day.other += hours;
        }

        // Category breakdown (applies to all types)
        if (block.category_id && catMap.has(block.category_id)) {
          catHoursMap.set(block.category_id, (catHoursMap.get(block.category_id) || 0) + hours);
        }
      }

      const totalHours = deepWorkHours + shallowWorkHours + otherHours;
      const deepWorkDays = Array.from(dailyMap.values()).filter((d) => d.deep > 0).length;
      const workingDays = dailyMap.size || 1;
      const avgDailyDeepWork = deepWorkHours / workingDays;

      // Category breakdown sorted desc
      const categoryBreakdown: CategoryBreakdown[] = Array.from(catHoursMap.entries())
        .map(([id, hours]) => {
          const cat = catMap.get(id)!;
          return { name: cat.name, color: cat.color, hours, percentage: totalHours > 0 ? (hours / totalHours) * 100 : 0 };
        })
        .sort((a, b) => b.hours - a.hours);

      const topCategory = categoryBreakdown[0] || null;

      // Daily points for the last 14 days of the month (to keep the chart readable)
      const allDays = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const dailyPoints: DailyPoint[] = allDays.map(([date, vals]) => ({
        day: DAY_LABELS[new Date(date + "T12:00:00").getDay()],
        date,
        deepWork: parseFloat(vals.deep.toFixed(1)),
        shallowWork: parseFloat(vals.shallow.toFixed(1)),
        other: parseFloat(vals.other.toFixed(1)),
      }));

      // Weekly summaries
      const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
      const weekSummaries: WeekSummary[] = weeks.map((weekStart, idx) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const clampedEnd = weekEnd > monthEnd ? monthEnd : weekEnd;

        let wDeep = 0, wShallow = 0, wOther = 0;
        const wCatMap = new Map<string, number>();

        for (const block of blocks) {
          const bDate = format(parseISO(block.start_time), "yyyy-MM-dd");
          const bDateObj = parseISO(bDate);
          if (bDateObj >= weekStart && bDateObj <= clampedEnd) {
            const h = durationHours(block.start_time, block.end_time);
            if (block.type === "deep") wDeep += h;
            else if (block.type === "shallow") wShallow += h;
            else wOther += h;
            if (block.category_id && catMap.has(block.category_id)) {
              wCatMap.set(block.category_id, (wCatMap.get(block.category_id) || 0) + h);
            }
          }
        }

        let topCat: WeekSummary["topCategory"] = null;
        let maxH = 0;
        for (const [id, h] of wCatMap.entries()) {
          if (h > maxH) { maxH = h; const c = catMap.get(id)!; topCat = { name: c.name, color: c.color, hours: h }; }
        }

        return {
          label: `Semana ${idx + 1}`,
          startDate: format(weekStart, "dd MMM", { locale: es }),
          endDate: format(clampedEnd, "dd MMM", { locale: es }),
          deepWorkHours: parseFloat(wDeep.toFixed(1)),
          shallowWorkHours: parseFloat(wShallow.toFixed(1)),
          totalHours: parseFloat((wDeep + wShallow + wOther).toFixed(1)),
          topCategory: topCat,
        };
      });

      // Weekly deep work bar chart data
      const weeklyDeepWork = weekSummaries.map((w) => ({ week: w.label, hours: w.deepWorkHours }));

      set({
        stats: {
          deepWorkHours: parseFloat(deepWorkHours.toFixed(1)),
          shallowWorkHours: parseFloat(shallowWorkHours.toFixed(1)),
          otherHours: parseFloat(otherHours.toFixed(1)),
          totalHours: parseFloat(totalHours.toFixed(1)),
          deepWorkDays,
          avgDailyDeepWork: parseFloat(avgDailyDeepWork.toFixed(1)),
          topCategory,
          categoryBreakdown,
          dailyPoints,
          weekSummaries,
          weeklyDeepWork,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
