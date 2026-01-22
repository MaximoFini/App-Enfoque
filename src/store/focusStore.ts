import { create } from "zustand";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

export type FocusType = "deep" | "shallow";
export type FocusStatus = "idle" | "running" | "paused" | "finished";

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalDeepWorkMinutes: number;
  totalDistractions: number;
  distractionsPerHour: number;
}

interface FocusState {
  // Session configuration
  focusType: FocusType;
  durationMinutes: number; // 15-180 minutes

  // Timer state
  status: FocusStatus;
  timeRemaining: number; // in seconds
  timeElapsed: number; // in seconds (for tracking actual work time)

  // Distraction tracking (only for deep work)
  distractionsCount: number;

  // Session tracking
  sessionStartTime: Date | null;

  // Weekly stats for comparison
  weeklyStats: WeeklyStats[];
  currentWeekOffset: number; // 0 = current month (4 weeks), -1 = previous month, etc.

  // Loading state
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setFocusType: (type: FocusType) => void;
  setDuration: (minutes: number) => void;

  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  tick: () => void;

  registerDistraction: () => void;

  // Stats navigation
  goToPrevMonth: () => void;
  goToNextMonth: () => void;

  // Data fetching
  fetchWeeklyStats: () => Promise<void>;

  // Save session to database
  saveSession: () => Promise<void>;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  // Default configuration
  focusType: "deep",
  durationMinutes: 45,

  // Initial state
  status: "idle",
  timeRemaining: 45 * 60,
  timeElapsed: 0,

  // Distraction tracking
  distractionsCount: 0,

  // Session tracking
  sessionStartTime: null,

  // Weekly stats
  weeklyStats: [],
  currentWeekOffset: 0,

  // Loading states
  isLoading: false,
  isSaving: false,

  // Configuration actions
  setFocusType: (type) => {
    const state = get();
    if (state.status === "idle") {
      set({ focusType: type });
    }
  },

  setDuration: (minutes) => {
    const state = get();
    if (state.status === "idle") {
      const clampedMinutes = Math.max(15, Math.min(180, minutes));
      set({
        durationMinutes: clampedMinutes,
        timeRemaining: clampedMinutes * 60,
      });
    }
  },

  // Timer actions
  start: () => {
    set({
      status: "running",
      sessionStartTime: new Date(),
      timeElapsed: 0,
      distractionsCount: 0,
    });
  },

  pause: () => {
    set({ status: "paused" });
  },

  resume: () => {
    set({ status: "running" });
  },

  stop: () => {
    const state = get();
    if (state.timeElapsed > 0) {
      // Save the session before stopping
      get().saveSession();
    }
    set({
      status: "finished",
    });
  },

  reset: () => {
    const state = get();
    set({
      status: "idle",
      timeRemaining: state.durationMinutes * 60,
      timeElapsed: 0,
      distractionsCount: 0,
      sessionStartTime: null,
    });
  },

  tick: () => {
    const state = get();
    if (state.status !== "running") return;

    const newTimeRemaining = state.timeRemaining - 1;
    const newTimeElapsed = state.timeElapsed + 1;

    if (newTimeRemaining <= 0) {
      // Timer finished
      set({
        status: "finished",
        timeRemaining: 0,
        timeElapsed: newTimeElapsed,
      });
      // Auto-save session
      get().saveSession();
    } else {
      set({
        timeRemaining: newTimeRemaining,
        timeElapsed: newTimeElapsed,
      });
    }
  },

  registerDistraction: () => {
    const state = get();
    if (state.focusType === "deep" && state.status === "running") {
      set({ distractionsCount: state.distractionsCount + 1 });
    }
  },

  // Stats navigation
  goToPrevMonth: () => {
    const state = get();
    set({ currentWeekOffset: state.currentWeekOffset - 1 });
    get().fetchWeeklyStats();
  },

  goToNextMonth: () => {
    const state = get();
    if (state.currentWeekOffset < 0) {
      set({ currentWeekOffset: state.currentWeekOffset + 1 });
      get().fetchWeeklyStats();
    }
  },

  // Fetch weekly stats for distraction comparison
  fetchWeeklyStats: async () => {
    set({ isLoading: true });

    try {
      const { supabase } = await import("../lib/supabase");
      const state = get();

      // Calculate the 4 weeks to fetch based on offset
      const baseDate = new Date();
      const weeksToFetch: WeeklyStats[] = [];

      for (let i = 3; i >= 0; i--) {
        const weekOffset = state.currentWeekOffset * 4 - i;
        const weekDate = subWeeks(baseDate, -weekOffset);
        const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

        const { data, error } = await supabase
          .from("focus_sessions")
          .select("*")
          .eq("type", "deep")
          .gte("session_date", format(weekStart, "yyyy-MM-dd"))
          .lte("session_date", format(weekEnd, "yyyy-MM-dd"));

        if (error) throw error;

        let totalMinutes = 0;
        let totalDistractions = 0;

        (data || []).forEach((session: any) => {
          totalMinutes +=
            session.actual_minutes || session.duration_minutes || 0;
          totalDistractions += session.distractions_count || 0;
        });

        const totalHours = totalMinutes / 60;
        const distractionsPerHour =
          totalHours > 0 ? totalDistractions / totalHours : 0;

        weeksToFetch.push({
          weekStart: format(weekStart, "yyyy-MM-dd"),
          weekEnd: format(weekEnd, "yyyy-MM-dd"),
          totalDeepWorkMinutes: totalMinutes,
          totalDistractions,
          distractionsPerHour: Math.round(distractionsPerHour * 100) / 100,
        });
      }

      set({ weeklyStats: weeksToFetch, isLoading: false });
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      set({ isLoading: false });
    }
  },

  // Save session to database
  saveSession: async () => {
    const state = get();
    if (state.timeElapsed === 0) return;

    set({ isSaving: true });

    try {
      const { supabase } = await import("../lib/supabase");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const actualMinutes = Math.round(state.timeElapsed / 60);

      const { error } = await supabase.from("focus_sessions").insert({
        user_id: user.id,
        type: state.focusType,
        duration_minutes: state.durationMinutes,
        actual_minutes: actualMinutes,
        distractions_count:
          state.focusType === "deep" ? state.distractionsCount : 0,
        session_date: format(
          state.sessionStartTime || new Date(),
          "yyyy-MM-dd",
        ),
      });

      if (error) throw error;

      console.log("Focus session saved successfully");

      // Refresh stats
      get().fetchWeeklyStats();
    } catch (error) {
      console.error("Error saving focus session:", error);
    } finally {
      set({ isSaving: false });
    }
  },
}));
