import { useEffect, useRef } from "react";
import {
  useGlobalTimerStore,
  formatTimeMs,
  getTimerLabel,
} from "../store/globalTimerStore";

/**
 * Título original de la aplicación
 */
const ORIGINAL_TITLE = "Bombini - Aplicacion de Enfoque";

/**
 * Intervalo de tick en milisegundos
 * Usamos 100ms para mayor precisión sin afectar performance
 */
const TICK_INTERVAL_MS = 100;

/**
 * GlobalTimerProvider
 * ====================
 *
 * Provider que debe montarse UNA SOLA VEZ en el nivel más alto de la app.
 * Responsabilidades:
 * 1. Restaurar estado del timer desde localStorage al montar
 * 2. Ejecutar un único intervalo global para el tick (sin memory leaks)
 * 3. Actualizar document.title con el countdown en tiempo real
 *
 * USO:
 * ```tsx
 * // En main.tsx o App.tsx
 * <GlobalTimerProvider>
 *   <App />
 * </GlobalTimerProvider>
 * ```
 */
export const GlobalTimerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const intervalRef = useRef<number | null>(null);
  const lastTitleUpdateRef = useRef<number>(0);

  // Obtener acciones del store
  const _tick = useGlobalTimerStore((s) => s._tick);
  const _restore = useGlobalTimerStore((s) => s._restore);

  // Estado para actualizar título
  const status = useGlobalTimerStore((s) => s.status);
  const activeTimer = useGlobalTimerStore((s) => s.activeTimer);
  const timeRemainingMs = useGlobalTimerStore((s) => s.timeRemainingMs);
  const pomodoroMode = useGlobalTimerStore((s) => s.pomodoroMode);
  const focusConfig = useGlobalTimerStore((s) => s.focusConfig);

  // Restaurar estado al montar (solo cliente)
  useEffect(() => {
    _restore();
  }, [_restore]);

  // Intervalo global único para el tick
  useEffect(() => {
    // Limpiar intervalo anterior si existe
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    // Solo crear intervalo si hay un timer corriendo
    if (status === "running") {
      intervalRef.current = window.setInterval(() => {
        _tick();
      }, TICK_INTERVAL_MS);
    }

    // Cleanup
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, _tick]);

  // Actualizar document.title
  useEffect(() => {
    const updateTitle = () => {
      // Evitar actualizaciones demasiado frecuentes (max 1 por segundo para el título)
      const now = Date.now();
      if (now - lastTitleUpdateRef.current < 900) return;
      lastTitleUpdateRef.current = now;

      if (status === "running" && activeTimer) {
        const label = getTimerLabel({ activeTimer, pomodoroMode, focusConfig });
        document.title = `${formatTimeMs(timeRemainingMs)} – ${label}`;
      } else if (status === "paused" && activeTimer) {
        document.title = `${formatTimeMs(timeRemainingMs)} – Paused`;
      } else {
        document.title = ORIGINAL_TITLE;
      }
    };

    updateTitle();

    // Si está corriendo, actualizar cada segundo para el título
    let titleInterval: number | null = null;
    if (status === "running") {
      titleInterval = window.setInterval(updateTitle, 1000);
    }

    return () => {
      if (titleInterval !== null) {
        clearInterval(titleInterval);
      }
    };
  }, [status, activeTimer, timeRemainingMs, pomodoroMode, focusConfig]);

  // Restaurar título al desmontar
  useEffect(() => {
    return () => {
      document.title = ORIGINAL_TITLE;
    };
  }, []);

  return <>{children}</>;
};

export default GlobalTimerProvider;
