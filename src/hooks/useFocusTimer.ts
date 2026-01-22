import { useCallback, useMemo } from "react";
import { useGlobalTimerStore } from "../store/globalTimerStore";
import { useFocusStore } from "../store/focusStore";

/**
 * Hook adaptador para la página de Enfoque
 * =========================================
 *
 * Conecta el nuevo store global de timers con la UI de Enfoque existente.
 * Mantiene la misma API que usaba useFocusStore para minimizar cambios en la UI.
 *
 * El store global maneja: timer, persistencia, timestamps
 * El focusStore original maneja: estadísticas semanales, guardado en DB
 */
export const useFocusTimer = () => {
  // Store global para el timer
  const globalTimer = useGlobalTimerStore();

  // Store original para estadísticas y guardado
  const originalStore = useFocusStore();

  // Derivar estado del timer
  const isActive = globalTimer.activeTimer === "focus";
  const isRunning = isActive && globalTimer.status === "running";
  const isPaused = isActive && globalTimer.status === "paused";
  const isFinished = isActive && globalTimer.status === "finished";
  const isIdle = !isActive || globalTimer.status === "idle";

  // Mapear status a la API original
  const status = useMemo(() => {
    if (!isActive) return "idle";
    return globalTimer.status;
  }, [isActive, globalTimer.status]);

  // Tiempo restante en segundos (para compatibilidad con UI)
  const timeRemaining = useMemo(() => {
    return Math.ceil(globalTimer.timeRemainingMs / 1000);
  }, [globalTimer.timeRemainingMs]);

  // Tiempo transcurrido en segundos
  const timeElapsed = useMemo(() => {
    return Math.floor(globalTimer.timeElapsedMs / 1000);
  }, [globalTimer.timeElapsedMs]);

  // Duración en minutos
  const durationMinutes = useMemo(() => {
    return Math.round(globalTimer.focusConfig.durationMs / 60000);
  }, [globalTimer.focusConfig.durationMs]);

  // Acciones adaptadas
  const setFocusType = useCallback(
    (type: "deep" | "shallow") => {
      globalTimer.setFocusType(type);
    },
    [globalTimer.setFocusType],
  );

  const setDuration = useCallback(
    (minutes: number) => {
      globalTimer.setFocusDuration(minutes);
    },
    [globalTimer.setFocusDuration],
  );

  const start = useCallback(() => {
    globalTimer.startFocus();
  }, [globalTimer.startFocus]);

  const pause = useCallback(() => {
    globalTimer.pause();
  }, [globalTimer.pause]);

  const resume = useCallback(() => {
    globalTimer.resume();
  }, [globalTimer.resume]);

  const stop = useCallback(async () => {
    // Guardar sesión si hay tiempo transcurrido
    // TODO: Integrar guardado con supabase directamente aquí si es necesario
    globalTimer.stop();
  }, [globalTimer]);

  const reset = useCallback(() => {
    globalTimer.reset();
  }, [globalTimer.reset]);

  const registerDistraction = useCallback(() => {
    globalTimer.registerDistraction();
  }, [globalTimer.registerDistraction]);

  return {
    // Configuración
    focusType: globalTimer.focusConfig.focusType,
    durationMinutes,

    // Estado del timer
    status,
    timeRemaining,
    timeElapsed,
    distractionsCount: globalTimer.distractionsCount,

    // Estado para UI
    isRunning,
    isPaused,
    isFinished,
    isIdle,

    // Estadísticas (del store original)
    weeklyStats: originalStore.weeklyStats,
    currentWeekOffset: originalStore.currentWeekOffset,
    isLoading: originalStore.isLoading,
    isSaving: originalStore.isSaving,

    // Acciones del timer
    setFocusType,
    setDuration,
    start,
    pause,
    resume,
    stop,
    reset,
    registerDistraction,

    // Acciones de estadísticas (del store original)
    goToPrevMonth: originalStore.goToPrevMonth,
    goToNextMonth: originalStore.goToNextMonth,
    fetchWeeklyStats: originalStore.fetchWeeklyStats,
  };
};
