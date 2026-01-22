import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

/**
 * Sistema de Timer Global con Persistencia
 * =========================================
 *
 * Características:
 * - Timer único global que NO se desmonta con la navegación
 * - Cálculo basado en timestamps (endAtMs - Date.now()) para evitar drift
 * - Persistencia en localStorage para sobrevivir recargas (F5)
 * - Un solo intervalo global, sin memory leaks
 * - Compatible con SSR (solo accede a window/document en cliente)
 *
 * Estados del Timer:
 * - idle: Sin timer activo
 * - running: Timer corriendo (usa endAtMs para calcular tiempo restante)
 * - paused: Timer pausado (usa pausedRemainingMs para guardar tiempo)
 * - finished: Timer terminado
 */

// ============ TIPOS ============

export type TimerType = "pomodoro" | "focus";
export type PomodoroMode = "work" | "break";
export type FocusType = "deep" | "shallow";
export type TimerStatus = "idle" | "running" | "paused" | "finished";

interface PomodoroConfig {
  workDurationMs: number;
  breakDurationMs: number;
  autoPlay: boolean;
}

interface FocusConfig {
  focusType: FocusType;
  durationMs: number;
}

interface TimerState {
  // Estado actual del timer
  activeTimer: TimerType | null;
  status: TimerStatus;

  // Timestamps para cálculo preciso (evita drift)
  endAtMs: number | null; // Cuando el timer termina (running)
  pausedRemainingMs: number | null; // Tiempo restante cuando se pausó

  // Tiempo calculado (actualizado cada tick)
  timeRemainingMs: number;

  // Configuración de Pomodoro
  pomodoroConfig: PomodoroConfig;
  pomodoroMode: PomodoroMode;
  totalWorkMs: number; // Tiempo total de trabajo acumulado
  sessionStartTime: number | null; // Timestamp de inicio de sesión

  // Configuración de Focus
  focusConfig: FocusConfig;
  timeElapsedMs: number; // Tiempo transcurrido en focus
  distractionsCount: number; // Distracciones (solo deep work)

  // Acciones de configuración
  setPomodoroWorkDuration: (minutes: number) => void;
  setPomodoroBreakDuration: (minutes: number) => void;
  setPomodoroAutoPlay: (enabled: boolean) => void;
  setFocusType: (type: FocusType) => void;
  setFocusDuration: (minutes: number) => void;

  // Acciones del timer
  startPomodoro: () => void;
  startFocus: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;

  // Pomodoro específico
  switchPomodoroMode: (mode: PomodoroMode) => void;

  // Focus específico
  registerDistraction: () => void;

  // Tick interno (llamado por el provider)
  _tick: () => void;

  // Restaurar desde localStorage
  _restore: () => void;

  // Persistir a localStorage
  _persist: () => void;
}

// ============ CONSTANTES ============

const STORAGE_KEY = "bombini_timer_state";
const DEFAULT_POMODORO_WORK_MS = 25 * 60 * 1000;
const DEFAULT_POMODORO_BREAK_MS = 5 * 60 * 1000;
const DEFAULT_FOCUS_DURATION_MS = 45 * 60 * 1000;

// ============ HELPERS ============

const isClient = typeof window !== "undefined";

const loadFromStorage = (): Partial<TimerState> | null => {
  if (!isClient) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const saveToStorage = (state: Partial<TimerState>) => {
  if (!isClient) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeTimer: state.activeTimer,
        status: state.status,
        endAtMs: state.endAtMs,
        pausedRemainingMs: state.pausedRemainingMs,
        pomodoroConfig: state.pomodoroConfig,
        pomodoroMode: state.pomodoroMode,
        totalWorkMs: state.totalWorkMs,
        sessionStartTime: state.sessionStartTime,
        focusConfig: state.focusConfig,
        timeElapsedMs: state.timeElapsedMs,
        distractionsCount: state.distractionsCount,
      }),
    );
  } catch {
    // Silently fail
  }
};

const clearStorage = () => {
  if (!isClient) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
};

// ============ STORE ============

export const useGlobalTimerStore = create<TimerState>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    activeTimer: null,
    status: "idle",
    endAtMs: null,
    pausedRemainingMs: null,
    timeRemainingMs: 0,

    // Pomodoro defaults
    pomodoroConfig: {
      workDurationMs: DEFAULT_POMODORO_WORK_MS,
      breakDurationMs: DEFAULT_POMODORO_BREAK_MS,
      autoPlay: true,
    },
    pomodoroMode: "work",
    totalWorkMs: 0,
    sessionStartTime: null,

    // Focus defaults
    focusConfig: {
      focusType: "deep",
      durationMs: DEFAULT_FOCUS_DURATION_MS,
    },
    timeElapsedMs: 0,
    distractionsCount: 0,

    // ========== CONFIGURACIÓN ==========

    setPomodoroWorkDuration: (minutes) => {
      const state = get();
      if (state.status !== "idle" && state.activeTimer === "pomodoro") return;

      set({
        pomodoroConfig: {
          ...state.pomodoroConfig,
          workDurationMs: minutes * 60 * 1000,
        },
      });
    },

    setPomodoroBreakDuration: (minutes) => {
      const state = get();
      if (state.status !== "idle" && state.activeTimer === "pomodoro") return;

      set({
        pomodoroConfig: {
          ...state.pomodoroConfig,
          breakDurationMs: minutes * 60 * 1000,
        },
      });
    },

    setPomodoroAutoPlay: (enabled) => {
      set((state) => ({
        pomodoroConfig: {
          ...state.pomodoroConfig,
          autoPlay: enabled,
        },
      }));
    },

    setFocusType: (type) => {
      const state = get();
      if (state.status !== "idle") return;

      set({
        focusConfig: {
          ...state.focusConfig,
          focusType: type,
        },
      });
    },

    setFocusDuration: (minutes) => {
      const state = get();
      if (state.status !== "idle") return;

      const clampedMinutes = Math.max(15, Math.min(180, minutes));
      set({
        focusConfig: {
          ...state.focusConfig,
          durationMs: clampedMinutes * 60 * 1000,
        },
      });
    },

    // ========== ACCIONES DEL TIMER ==========

    startPomodoro: () => {
      const state = get();
      const durationMs =
        state.pomodoroMode === "work"
          ? state.pomodoroConfig.workDurationMs
          : state.pomodoroConfig.breakDurationMs;

      const now = Date.now();

      set({
        activeTimer: "pomodoro",
        status: "running",
        endAtMs: now + durationMs,
        pausedRemainingMs: null,
        timeRemainingMs: durationMs,
        sessionStartTime: state.sessionStartTime || now,
      });

      get()._persist();
    },

    startFocus: () => {
      const state = get();
      const now = Date.now();

      set({
        activeTimer: "focus",
        status: "running",
        endAtMs: now + state.focusConfig.durationMs,
        pausedRemainingMs: null,
        timeRemainingMs: state.focusConfig.durationMs,
        timeElapsedMs: 0,
        distractionsCount: 0,
        sessionStartTime: now,
      });

      get()._persist();
    },

    pause: () => {
      const state = get();
      if (state.status !== "running") return;

      // Calcular tiempo restante actual
      const remaining = state.endAtMs
        ? Math.max(0, state.endAtMs - Date.now())
        : 0;

      set({
        status: "paused",
        endAtMs: null,
        pausedRemainingMs: remaining,
        timeRemainingMs: remaining,
      });

      get()._persist();
    },

    resume: () => {
      const state = get();
      if (state.status !== "paused") return;

      const remaining = state.pausedRemainingMs || 0;

      set({
        status: "running",
        endAtMs: Date.now() + remaining,
        pausedRemainingMs: null,
      });

      get()._persist();
    },

    stop: () => {
      set({
        status: "finished",
        endAtMs: null,
        pausedRemainingMs: null,
      });

      clearStorage();
    },

    reset: () => {
      const state = get();

      if (state.activeTimer === "pomodoro") {
        const durationMs =
          state.pomodoroMode === "work"
            ? state.pomodoroConfig.workDurationMs
            : state.pomodoroConfig.breakDurationMs;

        set({
          status: "idle",
          endAtMs: null,
          pausedRemainingMs: null,
          timeRemainingMs: durationMs,
          totalWorkMs: 0,
          sessionStartTime: null,
          pomodoroMode: "work",
        });
      } else if (state.activeTimer === "focus") {
        set({
          status: "idle",
          endAtMs: null,
          pausedRemainingMs: null,
          timeRemainingMs: state.focusConfig.durationMs,
          timeElapsedMs: 0,
          distractionsCount: 0,
          sessionStartTime: null,
        });
      } else {
        set({
          activeTimer: null,
          status: "idle",
          endAtMs: null,
          pausedRemainingMs: null,
          timeRemainingMs: 0,
        });
      }

      clearStorage();
    },

    switchPomodoroMode: (mode) => {
      const state = get();
      if (state.status === "running") return;

      const durationMs =
        mode === "work"
          ? state.pomodoroConfig.workDurationMs
          : state.pomodoroConfig.breakDurationMs;

      set({
        pomodoroMode: mode,
        timeRemainingMs: durationMs,
        status: "idle",
        endAtMs: null,
        pausedRemainingMs: null,
      });
    },

    registerDistraction: () => {
      const state = get();
      if (
        state.activeTimer !== "focus" ||
        state.focusConfig.focusType !== "deep"
      )
        return;
      if (state.status !== "running") return;

      set({ distractionsCount: state.distractionsCount + 1 });
      get()._persist();
    },

    // ========== TICK (llamado por provider) ==========

    _tick: () => {
      const state = get();
      if (state.status !== "running" || !state.endAtMs) return;

      const now = Date.now();
      const remaining = Math.max(0, state.endAtMs - now);

      // Actualizar tiempo transcurrido para focus
      if (state.activeTimer === "focus" && state.sessionStartTime) {
        const elapsed = now - state.sessionStartTime;
        set({ timeElapsedMs: elapsed });
      }

      // Actualizar trabajo acumulado para pomodoro
      if (state.activeTimer === "pomodoro" && state.pomodoroMode === "work") {
        const totalDuration = state.pomodoroConfig.workDurationMs;
        const worked = totalDuration - remaining;
        // Solo actualizar si ha cambiado significativamente (evitar re-renders innecesarios)
        if (Math.abs(worked - state.totalWorkMs) >= 1000) {
          set({ totalWorkMs: worked });
        }
      }

      if (remaining <= 0) {
        // Timer terminado
        if (state.activeTimer === "pomodoro") {
          // Sumar el tiempo de trabajo completado
          const completedWorkMs =
            state.pomodoroMode === "work"
              ? state.pomodoroConfig.workDurationMs
              : 0;

          const newTotalWorkMs =
            state.pomodoroMode === "work"
              ? state.totalWorkMs + completedWorkMs
              : state.totalWorkMs;

          if (state.pomodoroConfig.autoPlay) {
            // Cambiar automáticamente de modo
            const nextMode: PomodoroMode =
              state.pomodoroMode === "work" ? "break" : "work";
            const nextDuration =
              nextMode === "work"
                ? state.pomodoroConfig.workDurationMs
                : state.pomodoroConfig.breakDurationMs;

            set({
              pomodoroMode: nextMode,
              endAtMs: now + nextDuration,
              timeRemainingMs: nextDuration,
              totalWorkMs: newTotalWorkMs,
            });

            get()._persist();
          } else {
            // Pausar y cambiar modo
            const nextMode: PomodoroMode =
              state.pomodoroMode === "work" ? "break" : "work";
            const nextDuration =
              nextMode === "work"
                ? state.pomodoroConfig.workDurationMs
                : state.pomodoroConfig.breakDurationMs;

            set({
              status: "paused",
              pomodoroMode: nextMode,
              endAtMs: null,
              pausedRemainingMs: nextDuration,
              timeRemainingMs: nextDuration,
              totalWorkMs: newTotalWorkMs,
            });

            get()._persist();
          }
        } else if (state.activeTimer === "focus") {
          set({
            status: "finished",
            timeRemainingMs: 0,
            endAtMs: null,
          });

          clearStorage();
        }
      } else {
        set({ timeRemainingMs: remaining });
      }
    },

    // ========== PERSISTENCIA ==========

    _restore: () => {
      const stored = loadFromStorage();
      if (!stored) return;

      const now = Date.now();

      // Restaurar configuración
      if (stored.pomodoroConfig) {
        set({ pomodoroConfig: stored.pomodoroConfig as PomodoroConfig });
      }
      if (stored.focusConfig) {
        set({ focusConfig: stored.focusConfig as FocusConfig });
      }
      if (stored.pomodoroMode) {
        set({ pomodoroMode: stored.pomodoroMode as PomodoroMode });
      }
      if (stored.sessionStartTime) {
        set({ sessionStartTime: stored.sessionStartTime });
      }
      if (stored.distractionsCount) {
        set({ distractionsCount: stored.distractionsCount });
      }

      // Restaurar estado del timer
      if (stored.status === "running" && stored.endAtMs) {
        const remaining = stored.endAtMs - now;

        if (remaining > 0) {
          // Timer aún tiene tiempo, continuar
          set({
            activeTimer: stored.activeTimer as TimerType,
            status: "running",
            endAtMs: stored.endAtMs,
            timeRemainingMs: remaining,
            totalWorkMs: stored.totalWorkMs || 0,
            timeElapsedMs: stored.timeElapsedMs || 0,
          });
        } else {
          // Timer expiró mientras la app estaba cerrada
          set({
            activeTimer: stored.activeTimer as TimerType,
            status: "finished",
            endAtMs: null,
            timeRemainingMs: 0,
          });
          clearStorage();
        }
      } else if (stored.status === "paused" && stored.pausedRemainingMs) {
        // Restaurar estado pausado
        set({
          activeTimer: stored.activeTimer as TimerType,
          status: "paused",
          pausedRemainingMs: stored.pausedRemainingMs,
          timeRemainingMs: stored.pausedRemainingMs,
          totalWorkMs: stored.totalWorkMs || 0,
          timeElapsedMs: stored.timeElapsedMs || 0,
        });
      }
    },

    _persist: () => {
      const state = get();
      saveToStorage(state);
    },
  })),
);

// ============ HELPERS EXPORTADOS ============

/**
 * Formatea milisegundos a MM:SS o HH:MM:SS si > 60 min
 */
export const formatTimeMs = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Calcula el porcentaje de progreso (0-100)
 */
export const calculateProgressMs = (
  remainingMs: number,
  totalMs: number,
): number => {
  if (totalMs <= 0) return 0;
  return ((totalMs - remainingMs) / totalMs) * 100;
};

/**
 * Obtiene el label del modo actual para mostrar en el título
 */
export const getTimerLabel = (state: {
  activeTimer: TimerType | null;
  pomodoroMode: PomodoroMode;
  focusConfig: { focusType: FocusType };
}): string => {
  if (state.activeTimer === "pomodoro") {
    return state.pomodoroMode === "work" ? "Time to focus!" : "Break";
  }
  if (state.activeTimer === "focus") {
    return state.focusConfig.focusType === "deep"
      ? "Deep Work"
      : "Shallow Work";
  }
  return "";
};
