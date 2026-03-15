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
  prefillStartTime?: string;
  prefillEndTime?: string;
  prefillDate?: string;
  prefillType?: BlockType;
  fromSession?: boolean;
}

// Round to nearest 15 minutes
const roundToQuarter = (minutes: number): number => Math.round(minutes / 15) * 15;

const formatTimeForInput = (hour: number, minutes: number = 0): string => {
  const roundedMinutes = roundToQuarter(minutes);
  const adjustedHour = roundedMinutes === 60 ? hour + 1 : hour;
  const adjustedMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
  return `${adjustedHour.toString().padStart(2, "0")}:${adjustedMinutes.toString().padStart(2, "0")}`;
};

// Full color palette — same hex values used in categoryStore.CATEGORY_COLORS
const COLOR_PALETTE: { hex: string; label: string }[] = [
  { hex: "#8B5CF6", label: "Violeta" },
  { hex: "#6366F1", label: "Indigo" },
  { hex: "#3B82F6", label: "Azul" },
  { hex: "#06B6D4", label: "Cyan" },
  { hex: "#10B981", label: "Esmeralda" },
  { hex: "#34D399", label: "Verde" },
  { hex: "#F59E0B", label: "Amarillo" },
  { hex: "#F97316", label: "Naranja" },
  { hex: "#EF4444", label: "Rojo" },
  { hex: "#EC4899", label: "Rosa" },
  { hex: "#D946EF", label: "Fucsia" },
  { hex: "#6B7280", label: "Gris" },
];

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
  const [customColorHex, setCustomColorHex] = useState<string>(COLOR_PALETTE[0].hex);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [date, setDate] = useState("");

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Derived: effective color hex for preview
  const effectiveColorHex =
    type === "deep-work" ? "#8B5CF6"
    : type === "shallow-work" ? "#10B981"
    : categoryId
      ? (categories.find((c) => c.id === categoryId)?.color ?? customColorHex)
      : customColorHex;

  // Auto-sync customColorHex when category changes
  useEffect(() => {
    if (categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) setCustomColorHex(cat.color);
    }
  }, [categoryId, categories]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingBlock) {
      setTitle(editingBlock.title);
      setType(editingBlock.type);
      setCustomColorHex(
        editingBlock.type === "other" && !editingBlock.categoryId
          ? (editingBlock.color ? hexForBlockColor(editingBlock.color) : COLOR_PALETTE[0].hex)
          : COLOR_PALETTE[0].hex
      );
      setCategoryId(editingBlock.categoryId || null);
      setStartTime(editingBlock.startTime);
      setEndTime(editingBlock.endTime);
      setDate(editingBlock.date);
    } else {
      setTitle("");
      setType(prefillType || "deep-work");
      setCustomColorHex(COLOR_PALETTE[0].hex);
      setCategoryId(null);
      setDate(
        prefillDate ? prefillDate
        : selectedDate ? format(selectedDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd")
      );
      setStartTime(
        prefillStartTime ? prefillStartTime
        : selectedHour !== undefined ? formatTimeForInput(selectedHour)
        : formatTimeForInput(new Date().getHours(), new Date().getMinutes())
      );
      setEndTime(
        prefillEndTime ? prefillEndTime
        : selectedHour !== undefined ? formatTimeForInput(selectedHour + 1)
        : formatTimeForInput(new Date().getHours() + 1, new Date().getMinutes())
      );
    }
  }, [isOpen, editingBlock, selectedDate, selectedHour, prefillStartTime, prefillEndTime, prefillDate, prefillType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const blockData = {
      title: title.trim(),
      type,
      color: type === "other" && !categoryId ? (closestBlockColor(customColorHex) as BlockColor) : undefined,
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
    }
  };

  const handleDelete = async () => {
    if (!editingBlock) return;
    try {
      await deleteBlock(editingBlock.id);
      onClose();
    } catch (error) {
      console.error("Error deleting block:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#1e232e] rounded-xl shadow-2xl border border-[#3b4354] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282e39]">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-200"
              style={{ backgroundColor: effectiveColorHex }}
            />
            <h3 className="text-lg font-bold text-white">
              {editingBlock ? "Editar Bloque" : "Nuevo Bloque"}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {fromSession && (
          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
            <div>
              <p className="text-xs font-semibold text-emerald-400">Sesion completada!</p>
              <p className="text-[11px] text-emerald-400/70">Registra esta sesion como bloque en tu calendario.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9da6b9] uppercase">Titulo</label>
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
            <label className="text-xs font-semibold text-[#9da6b9] uppercase">Tipo de Trabajo</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "deep-work" as BlockType, icon: "psychology", label: "Deep", color: "#8B5CF6" },
                { value: "shallow-work" as BlockType, icon: "speed", label: "Shallow", color: "#10B981" },
                { value: "other" as BlockType, icon: "calendar_view_day", label: "Otro", color: effectiveColorHex },
              ].map(({ value, icon, label, color }) => (
                <label key={value} className="cursor-pointer">
                  <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} className="peer sr-only" />
                  <div
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                      ${type === value ? "border-opacity-100" : "border-[#282e39] bg-[#111318] text-gray-400 hover:bg-[#282e39]"}`}
                    style={type === value ? {
                      backgroundColor: `${color}1a`,
                      borderColor: color,
                      color: color,
                    } : undefined}
                  >
                    <span className="material-symbols-outlined mb-1 text-[20px]">{icon}</span>
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9da6b9] uppercase">Categoria (Opcional)</label>
            <div className="relative">
              <select
                value={categoryId || ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent appearance-none"
              >
                <option value="">Sin categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-7 flex items-center">
                {categoryId && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categories.find((c) => c.id === categoryId)?.color }}
                  />
                )}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </div>
            </div>
          </div>

          {/* Custom color picker — only for "other" blocks without category */}
          {type === "other" && !categoryId && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#9da6b9] uppercase">Color del bloque</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map(({ hex, label }) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setCustomColorHex(hex)}
                    title={label}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: hex,
                      boxShadow: customColorHex === hex ? `0 0 0 2px #1e232e, 0 0 0 4px ${hex}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9da6b9] uppercase">Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent" />
          </div>

          {/* Start / End time */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-[#9da6b9] uppercase">Inicio</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} step="900"
                className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent" />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-[#9da6b9] uppercase">Fin</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} step="900"
                className="w-full bg-[#111318] border border-[#282e39] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cal-primary focus:border-transparent" />
            </div>
          </div>

          {endTime <= startTime && startTime !== "" && endTime !== "" && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-[16px]">nights_stay</span>
              <span>El bloque termina al dia siguiente (+1 dia)</span>
            </div>
          )}
        </form>

        <div className="bg-[#252b36] px-6 py-4 flex justify-between gap-3 border-t border-[#282e39]">
          <div>
            {editingBlock && (
              <button type="button" onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#3b4354] rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" onClick={handleSubmit}
              className="px-6 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-lg"
              style={{ backgroundColor: effectiveColorHex, boxShadow: `0 4px 14px ${effectiveColorHex}50` }}>
              {editingBlock ? "Guardar" : "Crear Bloque"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Map legacy BlockColor enum to hex
function hexForBlockColor(color: BlockColor): string {
  const map: Record<BlockColor, string> = {
    blue: "#3B82F6", red: "#EF4444", yellow: "#F59E0B",
    pink: "#EC4899", orange: "#F97316", gray: "#6B7280",
  };
  return map[color] ?? COLOR_PALETTE[0].hex;
}

// Map hex to closest legacy BlockColor (for blocks without a category)
function closestBlockColor(hex: string): BlockColor {
  const map: Record<string, BlockColor> = {
    "#3B82F6": "blue", "#6366F1": "blue",
    "#EF4444": "red",
    "#F59E0B": "yellow", "#F97316": "orange",
    "#EC4899": "pink", "#D946EF": "pink",
    "#6B7280": "gray",
    "#8B5CF6": "gray", "#06B6D4": "blue",
    "#10B981": "gray", "#34D399": "gray",
  };
  return map[hex] ?? "blue";
}
