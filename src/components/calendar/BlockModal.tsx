import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  useCalendarStore,
  BlockType,
  BlockColor,
  TimeBlock,
} from "../../store/calendarStoreNew";

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
  selectedHour?: number;
  editingBlock?: TimeBlock | null;
  // Props de pre-completado (para modal post-sesión)
  prefillStartTime?: string;
  prefillEndTime?: string;
  prefillDate?: string;
  prefillType?: BlockType;
  /** Si true muestra un banner explicando que viene de una sesión finalizada */
  fromSession?: boolean;
}

const BLOCK_COLORS: { value: BlockColor; hex: string; label: string }[] = [
  { value: "blue", hex: "#3B82F6", label: "Azul" },
  { value: "red", hex: "#EF4444", label: "Rojo" },
  { value: "yellow", hex: "#F59E0B", label: "Amarillo" },
  { value: "pink", hex: "#EC4899", label: "Rosa" },
  { value: "orange", hex: "#F97316", label: "Naranja" },
  { value: "gray", hex: "#6B7280", label: "Gris" },
];

// Round to nearest 15 minutes
const roundToQuarter = (minutes: number): number => {
  return Math.round(minutes / 15) * 15;
};

// Format time for input (HH:mm)
const formatTimeForInput = (hour: number, minutes: number = 0): string => {
  const roundedMinutes = roundToQuarter(minutes);
  const adjustedHour = roundedMinutes === 60 ? hour + 1 : hour;
  const adjustedMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
  return `${adjustedHour.toString().padStart(2, "0")}:${adjustedMinutes.toString().padStart(2, "0")}`;
};

export const BlockModal = ({
  isOpen,
  onClose,
  selectedDate,
  selectedHour,
  editingBlock,
  prefillStartTime,
  prefillEndTime,
  prefillDate,
  prefillType,
  fromSession = false,
}: BlockModalProps) => {
  const { addBlock, updateBlock, deleteBlock, categories, fetchCategories } =
    useCalendarStore();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<BlockType>("deep-work");
  const [color, setColor] = useState<BlockColor>("blue");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [date, setDate] = useState("");

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingBlock) {
        // Editing existing block
        setTitle(editingBlock.title);
        setType(editingBlock.type);
        setColor(editingBlock.color || "blue");
        setCategoryId(editingBlock.categoryId || null);
        setStartTime(editingBlock.startTime);
        setEndTime(editingBlock.endTime);
        setDate(editingBlock.date);
      } else {
        // Creating new block
        setTitle("");
        setType(prefillType || "deep-work");
        setColor("blue");
        setCategoryId(null);

        // Prefill de fecha
        if (prefillDate) {
          setDate(prefillDate);
        } else if (selectedDate) {
          setDate(format(selectedDate, "yyyy-MM-dd"));
        } else {
          setDate(format(new Date(), "yyyy-MM-dd"));
        }

        // Prefill de hora de inicio
        if (prefillStartTime) {
          setStartTime(prefillStartTime);
        } else if (selectedHour !== undefined) {
          setStartTime(formatTimeForInput(selectedHour));
        } else {
          const now = new Date();
          setStartTime(formatTimeForInput(now.getHours(), now.getMinutes()));
        }

        // Prefill de hora de fin
        if (prefillEndTime) {
          setEndTime(prefillEndTime);
        } else if (selectedHour !== undefined) {
          setEndTime(formatTimeForInput(selectedHour + 1));
        } else {
          const now = new Date();
          setEndTime(formatTimeForInput(now.getHours() + 1, now.getMinutes()));
        }
      }
    }
  }, [isOpen, editingBlock, selectedDate, selectedHour, prefillStartTime, prefillEndTime, prefillDate, prefillType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    const blockData = {
      title: title.trim(),
      type,
      // Solo guardamos color manual cuando es "other" sin categoría.
      // deep-work y shallow-work tienen color fijo por tipo en getBlockStyles.
      // other con categoría usará en el futuro el color de la categoría desde CalendarGrid.
      color: type === "other" && !categoryId ? color : undefined,
      categoryId: categoryId || undefined,
      date,
      startTime,
      endTime,
      completed: editingBlock?.completed || false,
    };

    try {
      if (editingBlock) {
        await updateBlock(editingBlock.id, blockData);
      } else {
        await addBlock(blockData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving block:", error);
      // TODO: Show error toast
    }
  };

  const handleDelete = async () => {
    if (editingBlock) {
      try {
        await deleteBlock(editingBlock.id);
        onClose();
      } catch (error) {
        console.error("Error deleting block:", error);
        // TODO: Show error toast
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#1e232e] rounded-xl shadow-2xl border border-[#3b4354] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282e39]">
          <h3 className="text-lg font-bold text-white">
            {editingBlock ? "Editar Bloque" : "Nuevo Bloque"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Banner de sesión completada */}
        {fromSession && (
          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">
              check_circle
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-400">
                ¡Sesión completada!
              </p>
              <p className="text-[11px] text-emerald-400/70">
                Registra esta sesión como bloque en tu calendario.
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9da6b9] uppercase">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Programar feature X"
              autoFocus
              className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent"
            />
          </div>

          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9da6b9] uppercase">
              Tipo de Trabajo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Deep Work */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="deep-work"
                  checked={type === "deep-work"}
                  onChange={() => setType("deep-work")}
                  className="peer sr-only"
                />
                <div
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                  ${type === "deep-work"
                      ? "bg-[#8b5cf6]/10 border-[#8b5cf6] text-[#8b5cf6]"
                      : "border-[#282e39] bg-[#111318] text-gray-400 hover:bg-[#282e39]"
                    }`}
                >
                  <span className="material-symbols-outlined mb-1 text-[20px]">
                    psychology
                  </span>
                  <span className="text-xs font-medium">Deep</span>
                </div>
              </label>

              {/* Shallow Work */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="shallow-work"
                  checked={type === "shallow-work"}
                  onChange={() => setType("shallow-work")}
                  className="peer sr-only"
                />
                <div
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                  ${type === "shallow-work"
                      ? "bg-[#10b981]/10 border-[#10b981] text-[#10b981]"
                      : "border-[#282e39] bg-[#111318] text-gray-400 hover:bg-[#282e39]"
                    }`}
                >
                  <span className="material-symbols-outlined mb-1 text-[20px]">
                    speed
                  </span>
                  <span className="text-xs font-medium">Shallow</span>
                </div>
              </label>

              {/* Other */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="other"
                  checked={type === "other"}
                  onChange={() => setType("other")}
                  className="peer sr-only"
                />
                <div
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                  ${type === "other"
                      ? "bg-cal-primary/10 border-cal-primary text-cal-primary"
                      : "border-[#282e39] bg-[#111318] text-gray-400 hover:bg-[#282e39]"
                    }`}
                >
                  <span className="material-symbols-outlined mb-1 text-[20px]">
                    calendar_view_day
                  </span>
                  <span className="text-xs font-medium">Otro</span>
                </div>
              </label>
            </div>
          </div>

          {/* Color Selector — solo para "other" sin categoría seleccionada */}
          {type === "other" && !categoryId && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#9da6b9] uppercase">
                Color
              </label>
              <div className="flex gap-2">
                {BLOCK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full transition-all ${color === c.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e232e]"
                      : "hover:scale-110"
                      }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Indicador de color para deep/shallow o "other" con categoría */}
          {(type === "deep-work" || type === "shallow-work" || (type === "other" && categoryId)) && (
            <div className="flex items-center gap-2 py-1">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    type === "deep-work"
                      ? "#8B5CF6"
                      : type === "shallow-work"
                        ? "#10B981"
                        : categories.find((c) => c.id === categoryId)?.color || "#6B7280",
                }}
              />
              <span className="text-xs text-gray-400">
                {type === "deep-work"
                  ? "Color fijo: violeta (Deep Work)"
                  : type === "shallow-work"
                    ? "Color fijo: verde (Shallow Work)"
                    : `Color de la categoría seleccionada`}
              </span>
            </div>
          )}

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9da6b9] uppercase">
              Categoría (Opcional)
            </label>
            <div className="relative">
              <select
                value={categoryId || ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent appearance-none"
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <span className="material-symbols-outlined text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="flex gap-4">
            {/* Date */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-[#9da6b9] uppercase">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Time Row */}
          <div className="flex gap-4">
            {/* Start Time */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-[#9da6b9] uppercase">
                Inicio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="900"
                className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent"
              />
            </div>

            {/* End Time */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-[#9da6b9] uppercase">
                Fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="900"
                className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Hint cuando el bloque cruza medianoche */}
          {endTime <= startTime && startTime !== "" && endTime !== "" && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-[16px]">
                nights_stay
              </span>
              <span>
                El bloque termina al día siguiente (+1 día)
              </span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-[#252b36] px-6 py-4 flex justify-between gap-3 border-t border-[#282e39]">
          <div>
            {editingBlock && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#3b4354] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-bold text-white bg-cal-primary hover:bg-cal-primary/90 rounded-lg transition-colors shadow-lg shadow-cal-primary/30"
            >
              {editingBlock ? "Guardar" : "Crear Bloque"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
