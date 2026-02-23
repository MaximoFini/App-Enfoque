import { create } from "zustand";
import { format } from "date-fns";
import { BlockType } from "./calendarStoreNew";

/**
 * focusCompletionStore
 * ====================
 * Almacena la sesión de enfoque recién finalizada para mostrar el
 * BlockModal pre-completado en MainLayout. Se limpia automáticamente
 * cuando el usuario confirma o descarta el modal.
 */

export interface PendingFocusBlock {
    /** Fecha en formato YYYY-MM-DD */
    date: string;
    /** Hora de inicio en HH:mm (hora actual - duración real) */
    startTime: string;
    /** Hora de fin en HH:mm (hora actual al terminar) */
    endTime: string;
    /** Tipo de bloque según el tipo de sesión */
    type: BlockType;
}

interface FocusCompletionState {
    /** Bloque pendiente de registrar; null si no hay ninguno */
    pendingBlock: PendingFocusBlock | null;

    /** Llamar al finalizar una sesión focus para abrir el modal */
    triggerCompletion: (focusType: "deep" | "shallow", elapsedMs: number) => void;

    /** Limpiar el estado (al confirmar o descartar el modal) */
    clearCompletion: () => void;
}

export const useFocusCompletionStore = create<FocusCompletionState>((set) => ({
    pendingBlock: null,

    triggerCompletion: (focusType, elapsedMs) => {
        const now = new Date();
        const startMs = now.getTime() - elapsedMs;
        const startDate = new Date(startMs);

        const pendingBlock: PendingFocusBlock = {
            date: format(now, "yyyy-MM-dd"),
            startTime: format(startDate, "HH:mm"),
            endTime: format(now, "HH:mm"),
            type: focusType === "deep" ? "deep-work" : "shallow-work",
        };

        set({ pendingBlock });
    },

    clearCompletion: () => set({ pendingBlock: null }),
}));
