import { create } from "zustand";
import { format, subMinutes } from "date-fns";

export type PomodoroMode = "pomodoro" | "break" | "paused";

export interface SavedSessionData {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
}

interface PomodoroState {
  // Timer configuration
  pomodoroDuration: number; // in minutes (15-90)
  breakDuration: number; // in minutes (5-20)

  // Current timer state
  currentMode: PomodoroMode;
  timeRemaining: number; // in seconds
  isRunning: boolean;

  // Session tracking
  totalWorkMinutes: number; // Total accumulated work time in current session
  sessionStartTime: Date | null; // When the current work session started

  // Auto-play setting
  autoPlay: boolean;

  // Actions
  setPomodoroDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  setAutoPlay: (enabled: boolean) => void;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;

  switchMode: (mode: PomodoroMode) => void;

  // For saving to calendar
  getSessionPreview: () => SavedSessionData | null;
  clearSession: () => void;
}

// Round time to nearest 15 minutes
const roundTo15Minutes = (date: Date): Date => {
  const minutes = date.getMinutes();
  let roundedMinutes: number;

  if (minutes >= 53 || minutes <= 7) {
    roundedMinutes = 0;
    if (minutes >= 53) {
      date.setHours(date.getHours() + 1);
    }
  } else if (minutes >= 8 && minutes <= 22) {
    roundedMinutes = 15;
  } else if (minutes >= 23 && minutes <= 37) {
    roundedMinutes = 30;
  } else {
    roundedMinutes = 45;
  }

  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  // Default configuration
  pomodoroDuration: 25,
  breakDuration: 5,

  // Initial state
  currentMode: "pomodoro",
  timeRemaining: 25 * 60, // 25 minutes in seconds
  isRunning: false,

  // Session tracking
  totalWorkMinutes: 0,
  sessionStartTime: null,

  // Auto-play enabled by default
  autoPlay: true,

  // Configuration actions (only work when paused)
  setPomodoroDuration: (minutes) => {
    const state = get();
    if (!state.isRunning) {
      set({
        pomodoroDuration: minutes,
        // Reset timer if in pomodoro mode
        timeRemaining:
          state.currentMode === "pomodoro" ? minutes * 60 : state.timeRemaining,
      });
    }
  },

  setBreakDuration: (minutes) => {
    const state = get();
    if (!state.isRunning) {
      set({
        breakDuration: minutes,
        // Reset timer if in break mode
        timeRemaining:
          state.currentMode === "break" ? minutes * 60 : state.timeRemaining,
      });
    }
  },

  setAutoPlay: (enabled) => set({ autoPlay: enabled }),

  // Timer controls
  start: () => {
    const state = get();
    set({
      isRunning: true,
      currentMode:
        state.currentMode === "paused" ? "pomodoro" : state.currentMode,
      sessionStartTime: state.sessionStartTime || new Date(),
    });
  },

  pause: () => set({ isRunning: false }),

  reset: () => {
    const state = get();
    const duration =
      state.currentMode === "break"
        ? state.breakDuration
        : state.pomodoroDuration;
    set({
      timeRemaining: duration * 60,
      isRunning: false,
    });
  },

  tick: () => {
    const state = get();
    if (!state.isRunning) return;

    const newTimeRemaining = state.timeRemaining - 1;

    if (newTimeRemaining <= 0) {
      // Timer completed
      if (state.currentMode === "pomodoro") {
        // Add completed pomodoro time to total
        const completedMinutes = state.pomodoroDuration;
        const newTotalWorkMinutes = state.totalWorkMinutes + completedMinutes;

        if (state.autoPlay) {
          // Switch to break mode automatically
          set({
            currentMode: "break",
            timeRemaining: state.breakDuration * 60,
            totalWorkMinutes: newTotalWorkMinutes,
            isRunning: true,
          });
        } else {
          set({
            currentMode: "break",
            timeRemaining: state.breakDuration * 60,
            totalWorkMinutes: newTotalWorkMinutes,
            isRunning: false,
          });
        }
      } else if (state.currentMode === "break") {
        // Break finished, switch back to pomodoro
        if (state.autoPlay) {
          set({
            currentMode: "pomodoro",
            timeRemaining: state.pomodoroDuration * 60,
            isRunning: true,
          });
        } else {
          set({
            currentMode: "pomodoro",
            timeRemaining: state.pomodoroDuration * 60,
            isRunning: false,
          });
        }
      }
    } else {
      // Normal tick
      set({ timeRemaining: newTimeRemaining });

      // Track partial work time if in pomodoro mode
      if (state.currentMode === "pomodoro") {
        // We track full minutes, so we update totalWorkMinutes when a minute passes
        const previousMinutes = Math.floor(state.timeRemaining / 60);
        const currentMinutes = Math.floor(newTimeRemaining / 60);

        if (previousMinutes > currentMinutes) {
          set({ totalWorkMinutes: state.totalWorkMinutes + 1 });
        }
      }
    }
  },

  switchMode: (mode) => {
    const state = get();
    const duration =
      mode === "break" ? state.breakDuration : state.pomodoroDuration;
    set({
      currentMode: mode,
      timeRemaining: duration * 60,
      isRunning: false,
    });
  },

  // Get session preview for save modal
  getSessionPreview: () => {
    const state = get();

    if (state.totalWorkMinutes === 0) {
      return null;
    }

    const now = new Date();
    const startTime = subMinutes(now, state.totalWorkMinutes);

    // Round to 15 minutes
    const roundedStart = roundTo15Minutes(new Date(startTime));
    const roundedEnd = roundTo15Minutes(new Date(now));

    return {
      date: format(roundedStart, "yyyy-MM-dd"),
      startTime: format(roundedStart, "HH:mm"),
      endTime: format(roundedEnd, "HH:mm"),
      durationMinutes: state.totalWorkMinutes,
    };
  },

  clearSession: () => {
    const state = get();
    set({
      totalWorkMinutes: 0,
      sessionStartTime: null,
      currentMode: "pomodoro",
      timeRemaining: state.pomodoroDuration * 60,
      isRunning: false,
    });
  },
}));

// Helper to format time as MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Calculate progress percentage (0-100)
export const calculateProgress = (
  timeRemaining: number,
  totalDuration: number,
): number => {
  return ((totalDuration - timeRemaining) / totalDuration) * 100;
};
