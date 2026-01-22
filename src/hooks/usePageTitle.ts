import { useEffect, useRef } from "react";
import { usePomodoroStore } from "../store/pomodoroStore";
import { useFocusStore } from "../store/focusStore";

/**
 * Título original de la aplicación - se restaura cuando no hay timer activo
 */
const ORIGINAL_TITLE = "Bombini - Aplicacion de Enfoque";

/**
 * Formatea segundos a MM:SS o HH:MM:SS si dura más de 60 minutos
 */
const formatTime = (seconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Custom hook que actualiza el título de la pestaña del navegador con el countdown del timer.
 *
 * Comportamiento:
 * - RUNNING: Actualiza cada segundo mostrando "<tiempo> – <modo>"
 * - PAUSED: Muestra "<tiempo> – Paused" (mantiene el último tiempo)
 * - STOPPED/IDLE: Restaura el título original
 *
 * Usa timestamps (endAt - Date.now()) para evitar drift incluso con el tab en background.
 * Compatible con SSR: solo toca document dentro de useEffect (client-side).
 */
export const usePageTitle = () => {
  const pomodoroState = usePomodoroStore();
  const focusState = useFocusStore();

  // Refs para calcular tiempo restante basado en timestamps (evita drift)
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Cleanup function para limpiar intervalos
    const cleanup = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Obtener el label del modo actual
    const getModeLabel = (): string => {
      if (
        pomodoroState.isRunning ||
        (!focusState.status.match(/running|paused/) &&
          pomodoroState.timeRemaining > 0)
      ) {
        return pomodoroState.currentMode === "break"
          ? "Break"
          : "Time to focus!";
      }
      if (focusState.status === "running" || focusState.status === "paused") {
        return focusState.focusType === "deep" ? "Deep Work" : "Shallow Work";
      }
      return "";
    };

    // Determinar si algún timer está corriendo
    const isPomodoroRunning = pomodoroState.isRunning;
    const isFocusRunning = focusState.status === "running";
    const isAnyRunning = isPomodoroRunning || isFocusRunning;

    // Determinar si algún timer está pausado
    const isPaused =
      (!pomodoroState.isRunning &&
        pomodoroState.timeRemaining > 0 &&
        pomodoroState.timeRemaining < pomodoroState.pomodoroDuration * 60) ||
      focusState.status === "paused";

    // Obtener tiempo restante actual
    const getCurrentTimeRemaining = (): number => {
      if (
        isPomodoroRunning ||
        (!isFocusRunning &&
          pomodoroState.timeRemaining > 0 &&
          pomodoroState.timeRemaining < pomodoroState.pomodoroDuration * 60)
      ) {
        return pomodoroState.timeRemaining;
      }
      if (focusState.status === "running" || focusState.status === "paused") {
        return focusState.timeRemaining;
      }
      return 0;
    };

    // Si hay un timer corriendo
    if (isAnyRunning) {
      const timeRemaining = getCurrentTimeRemaining();
      // Calcular timestamp de finalización basado en tiempo restante actual
      endAtRef.current = Date.now() + timeRemaining * 1000;

      const updateTitle = () => {
        if (endAtRef.current === null) return;

        // Calcular tiempo restante basado en timestamp (evita drift)
        const remaining = Math.max(
          0,
          Math.ceil((endAtRef.current - Date.now()) / 1000),
        );
        const label = getModeLabel();
        document.title = `${formatTime(remaining)} – ${label}`;
      };

      // Actualizar inmediatamente
      updateTitle();

      // Configurar intervalo de 1 segundo
      cleanup(); // Limpiar intervalo anterior si existe
      intervalRef.current = window.setInterval(updateTitle, 1000);

      return cleanup;
    }

    // Si está pausado, mostrar estado de pausa
    if (isPaused) {
      cleanup();
      const timeRemaining = getCurrentTimeRemaining();
      const label = getModeLabel();
      if (timeRemaining > 0 && label) {
        document.title = `${formatTime(timeRemaining)} – Paused`;
      } else {
        document.title = ORIGINAL_TITLE;
      }
      return cleanup;
    }

    // No hay timer activo - restaurar título original
    cleanup();
    document.title = ORIGINAL_TITLE;

    return cleanup;
  }, [
    pomodoroState.isRunning,
    pomodoroState.timeRemaining,
    pomodoroState.currentMode,
    pomodoroState.pomodoroDuration,
    focusState.status,
    focusState.timeRemaining,
    focusState.focusType,
  ]);
};
