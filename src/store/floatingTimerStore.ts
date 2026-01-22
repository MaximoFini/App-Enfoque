import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimerSource = "pomodoro" | "focus" | null;

interface FloatingTimerState {
  // Minimized state
  isMinimized: boolean;
  source: TimerSource; // Which timer is minimized

  // Widget position
  position: { x: number; y: number };

  // Actions
  minimize: (source: TimerSource) => void;
  restore: () => void;
  setPosition: (x: number, y: number) => void;
}

export const useFloatingTimerStore = create<FloatingTimerState>()(
  persist(
    (set) => ({
      isMinimized: false,
      source: null,
      position: { x: window.innerWidth - 340, y: 80 }, // Default top-right

      minimize: (source) =>
        set({
          isMinimized: true,
          source,
        }),

      restore: () =>
        set({
          isMinimized: false,
          source: null,
        }),

      setPosition: (x, y) =>
        set({
          position: { x, y },
        }),
    }),
    {
      name: "floating-timer-storage",
      partialize: (state) => ({
        position: state.position,
      }),
    },
  ),
);
