import { useCallback, useMemo } from "react";
import { useGlobalTimerStore } from "../store/globalTimerStore";

/**
 * Hook adaptador para la página de Pomodoro
 * ==========================================
 *
 * Conecta el nuevo store global de timers con la UI de Pomodoro existente.
 * Mantiene la misma API que usaba usePomodoroStore para minimizar cambios en la UI.
 */

export interface SavedSessionData {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export const usePomodoroTimer = () => {
  const globalTimer = useGlobalTimerStore();

  // Derivar estado del timer
  const isActive = globalTimer.activeTimer === "pomodoro";
  const isRunning = isActive && globalTimer.status === "running";

  // Mapear currentMode a la API original
  const currentMode = useMemo(() => {
    if (!isActive) return "pomodoro";
    if (globalTimer.pomodoroMode === "break") return "break";
    return "pomodoro";
  }, [isActive, globalTimer.pomodoroMode]);

  // Tiempo restante en segundos
  const timeRemaining = useMemo(() => {
    if (!isActive) {
      // Si no está activo, mostrar la duración configurada
      return Math.round(globalTimer.pomodoroConfig.workDurationMs / 1000);
    }
    return Math.ceil(globalTimer.timeRemainingMs / 1000);
  }, [
    isActive,
    globalTimer.timeRemainingMs,
    globalTimer.pomodoroConfig.workDurationMs,
  ]);

  // Duración en minutos
  const pomodoroDuration = useMemo(() => {
    return Math.round(globalTimer.pomodoroConfig.workDurationMs / 60000);
  }, [globalTimer.pomodoroConfig.workDurationMs]);

  const breakDuration = useMemo(() => {
    return Math.round(globalTimer.pomodoroConfig.breakDurationMs / 60000);
  }, [globalTimer.pomodoroConfig.breakDurationMs]);

  // Tiempo total trabajado en minutos
  const totalWorkMinutes = useMemo(() => {
    return Math.floor(globalTimer.totalWorkMs / 60000);
  }, [globalTimer.totalWorkMs]);

  // Acciones
  const setPomodoroDuration = useCallback(
    (minutes: number) => {
      globalTimer.setPomodoroWorkDuration(minutes);
    },
    [globalTimer.setPomodoroWorkDuration],
  );

  const setBreakDuration = useCallback(
    (minutes: number) => {
      globalTimer.setPomodoroBreakDuration(minutes);
    },
    [globalTimer.setPomodoroBreakDuration],
  );

  const setAutoPlay = useCallback(
    (enabled: boolean) => {
      globalTimer.setPomodoroAutoPlay(enabled);
    },
    [globalTimer.setPomodoroAutoPlay],
  );

  const start = useCallback(() => {
    globalTimer.startPomodoro();
  }, [globalTimer.startPomodoro]);

  const pause = useCallback(() => {
    globalTimer.pause();
  }, [globalTimer.pause]);

  const resume = useCallback(() => {
    globalTimer.resume();
  }, [globalTimer.resume]);

  const reset = useCallback(() => {
    globalTimer.reset();
  }, [globalTimer.reset]);

  const switchMode = useCallback(
    (mode: "pomodoro" | "break") => {
      globalTimer.switchPomodoroMode(mode === "pomodoro" ? "work" : "break");
    },
    [globalTimer.switchPomodoroMode],
  );

  // Función para obtener preview de sesión para guardar
  const getSessionPreview = useCallback((): SavedSessionData | null => {
    if (globalTimer.totalWorkMs === 0) return null;

    const now = new Date();
    const totalMinutes = Math.floor(globalTimer.totalWorkMs / 60000);
    const startTime = new Date(now.getTime() - globalTimer.totalWorkMs);

    // Redondear a 15 minutos
    const roundTo15 = (date: Date): Date => {
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

    const roundedStart = roundTo15(new Date(startTime));
    const roundedEnd = roundTo15(new Date(now));

    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const formatTime = (d: Date) =>
      `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

    return {
      date: formatDate(roundedStart),
      startTime: formatTime(roundedStart),
      endTime: formatTime(roundedEnd),
      durationMinutes: totalMinutes,
    };
  }, [globalTimer.totalWorkMs]);

  const clearSession = useCallback(() => {
    globalTimer.reset();
  }, [globalTimer.reset]);

  return {
    // Configuración
    pomodoroDuration,
    breakDuration,
    autoPlay: globalTimer.pomodoroConfig.autoPlay,

    // Estado del timer
    currentMode,
    timeRemaining,
    isRunning,
    totalWorkMinutes,

    // Acciones
    setPomodoroDuration,
    setBreakDuration,
    setAutoPlay,
    start,
    pause,
    resume,
    reset,
    switchMode,
    getSessionPreview,
    clearSession,

    // Compatibilidad con API anterior (tick no se usa más, el provider lo maneja)
    tick: () => {},
  };
};

// Helper para formatear tiempo
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Helper para calcular progreso
export const calculateProgress = (
  timeRemaining: number,
  totalDuration: number,
): number => {
  if (totalDuration <= 0) return 0;
  return ((totalDuration - timeRemaining) / totalDuration) * 100;
};
