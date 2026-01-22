import { useState } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { SavedSessionData } from "../../store/pomodoroStore";

interface SaveToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  sessionData: SavedSessionData | null;
}

export const SaveToCalendarModal = ({
  isOpen,
  onClose,
  onConfirm,
  sessionData,
}: SaveToCalendarModalProps) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !sessionData) return null;

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error saving to calendar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formattedDate = format(
    parse(sessionData.date, "yyyy-MM-dd", new Date()),
    "EEEE, d 'de' MMMM",
    { locale: es },
  );

  // Calculate rounded duration
  const startParts = sessionData.startTime.split(":").map(Number);
  const endParts = sessionData.endTime.split(":").map(Number);
  const startMinutes = startParts[0] * 60 + startParts[1];
  const endMinutes = endParts[0] * 60 + endParts[1];
  const roundedDuration = endMinutes - startMinutes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1e232e] rounded-2xl w-full max-w-md mx-4 shadow-2xl border border-[#282e39] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282e39]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              calendar_add_on
            </span>
            Guardar en Calendario
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#282e39] rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview Card */}
          <div className="bg-[#282e39] rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-blue-500 rounded-full" />
              <div>
                <h3 className="text-white font-medium text-lg">Estudio</h3>
                <p className="text-gray-400 text-sm capitalize">
                  {formattedDate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1e232e] rounded-lg p-3">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  Inicio
                </p>
                <p className="text-white font-mono text-lg">
                  {sessionData.startTime}
                </p>
              </div>
              <div className="bg-[#1e232e] rounded-lg p-3">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  Fin
                </p>
                <p className="text-white font-mono text-lg">
                  {sessionData.endTime}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1e232e]">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="material-symbols-outlined text-[18px]">
                  schedule
                </span>
                <span className="text-sm">Duración real</span>
              </div>
              <span className="text-white font-medium">
                {sessionData.durationMinutes} min
              </span>
            </div>

            {roundedDuration !== sessionData.durationMinutes && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="material-symbols-outlined text-[18px]">
                    timer
                  </span>
                  <span className="text-sm">Duración redondeada</span>
                </div>
                <span className="text-emerald-400 font-medium">
                  {roundedDuration} min
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 bg-blue-500/10 rounded-lg p-3">
            <span className="material-symbols-outlined text-blue-400 text-[20px] mt-0.5">
              info
            </span>
            <p className="text-blue-300 text-sm">
              Los horarios se redondean al cuarto de hora más cercano para
              mantener la consistencia en tu calendario.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-[#191e28] border-t border-[#282e39]">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-xl bg-[#282e39] text-white font-medium hover:bg-[#343a47] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">
                  save
                </span>
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
