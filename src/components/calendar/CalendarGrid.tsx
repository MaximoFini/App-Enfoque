import { useEffect, useState, useRef } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  useCalendarStore,
  getBlockStyles,
  calculateBlockPosition,
  TimeBlock,
  Category,
} from "../../store/calendarStoreNew";
import { BlockModal } from "./BlockModal";

// Hours array from 0 to 23
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Height per hour in pixels — sized so 16h (7AM–11PM) fill ~1024px viewport
const HOUR_HEIGHT = 64;

// Default visible range: scroll to 7AM on mount
const DEFAULT_START_HOUR = 7;

// Minimum block size in minutes
const MIN_BLOCK_MINUTES = 15;

// Format hour for display
const formatHour = (hour: number) =>
  `${hour.toString().padStart(2, "0")}:00`;

// Convert total minutes to HH:mm string, clamped to 23:59
const minutesToTime = (totalMinutes: number): string => {
  const clamped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  const h = Math.floor(clamped / 60).toString().padStart(2, "0");
  const m = (clamped % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// Convert HH:mm string to total minutes
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// Check if a time range collides with any existing block on a given date
const hasCollision = (
  blocks: TimeBlock[],
  targetDate: string,
  startMinutes: number,
  endMinutes: number,
  excludeId?: string
): boolean => {
  return blocks
    .filter((b) => b.date === targetDate && b.id !== excludeId)
    .some((b) => {
      const bStart = timeToMinutes(b.startTime);
      // endTime "00:00" means end of day for midnight-crossing blocks
      const bEndRaw = timeToMinutes(b.endTime);
      const bEnd = bEndRaw === 0 ? 24 * 60 : bEndRaw;
      return startMinutes < bEnd && endMinutes > bStart;
    });
};

// Current time line
const CurrentTimeLine = () => {
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setPosition(((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
      style={{ top: `${position}px` }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
      <div className="flex-1 h-[2px] bg-red-500" />
    </div>
  );
};

// Single time block component
interface TimeBlockItemProps {
  block: TimeBlock;
  categories: Category[];
  isDragging?: boolean;
  isResizing?: boolean;
  resizePreviewEnd?: string;
  isContinuation?: boolean;
  onClick: () => void;
  onCopy: (block: TimeBlock) => void;
  onDragStart: (block: TimeBlock, offsetMinutes: number, e: React.MouseEvent) => void;
  onResizeStart: (block: TimeBlock, e: React.MouseEvent) => void;
}

const TimeBlockItem = ({
  block,
  categories,
  isDragging,
  isResizing,
  resizePreviewEnd,
  isContinuation,
  onClick,
  onCopy,
  onDragStart,
  onResizeStart,
}: TimeBlockItemProps) => {
  const displayEnd = isResizing && resizePreviewEnd ? resizePreviewEnd : block.endTime;
  const displayStart = isContinuation ? "00:00" : block.startTime;
  const { top, height } = calculateBlockPosition(displayStart, displayEnd);
  // Resolve category hex color for "other" blocks that have a categoryId
  const categoryHex = block.type === "other" && block.categoryId
    ? categories.find((c) => c.id === block.categoryId)?.color
    : undefined;
  const styles = getBlockStyles(block.type, block.color, categoryHex);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCopy(block);
  };

  // Drag handle: top bar — clicking it starts drag, does NOT open modal
  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isContinuation) return;
    e.stopPropagation();
    e.preventDefault();
    const offsetMinutes = 0; // drag from the very top of the block
    onDragStart(block, offsetMinutes, e);
  };

  // Resize handle: bottom bar — always resize, never edit
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isContinuation) return;
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(block, e);
  };

  // Body click → open edit modal (only when not currently dragging/resizing)
  const handleBodyClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border-l-4 group select-none
        ${styles.bg} ${styles.border} overflow-hidden
        ${isDragging ? "opacity-25 pointer-events-none" : ""}
        ${isContinuation ? "border-dashed opacity-60" : ""}`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: "20px", zIndex: 10, ...styles.inlineStyle }}
      onContextMenu={handleContextMenu}
    >
      {/* Drag handle — left side strip (over the colored border), cursor-move */}
      {!isContinuation && (
        <div
          className="absolute top-0 left-0 bottom-0 w-4 cursor-move z-20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-[3px]"
          onMouseDown={handleDragHandleMouseDown}
          title="Arrastrar"
        >
          <div className="w-[3px] h-[3px] rounded-full bg-white/70" />
          <div className="w-[3px] h-[3px] rounded-full bg-white/70" />
          <div className="w-[3px] h-[3px] rounded-full bg-white/70" />
          <div className="w-[3px] h-[3px] rounded-full bg-white/70" />
        </div>
      )}

      {/* Body — click opens modal, pl-2 to clear the drag handle zone */}
      <div
        className="absolute inset-0 pl-2 pr-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleBodyClick}
      >
        {isContinuation && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-t" />
        )}
        <p className={`text-xs font-semibold truncate leading-tight ${styles.text}`}>{block.title}</p>
        <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
          {isContinuation ? "00:00" : block.startTime} – {displayEnd}
        </p>
      </div>

      {/* Resize handle — bottom strip */}
      {!isContinuation && (
        <div
          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeMouseDown}
          title="Redimensionar"
        >
          <div className="w-8 h-1 bg-white/40 rounded-full" />
        </div>
      )}
    </div>
  );
};

// Day column component
interface DayColumnProps {
  date: Date;
  blocks: TimeBlock[];
  continuationBlocks: TimeBlock[];
  categories: Category[];
  isToday: boolean;
  dragOverHour: number | null;
  isDragOver: boolean;
  draggingBlock: TimeBlock | null;
  resizingBlock: TimeBlock | null;
  resizePreviewEnd: string;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onBlockClick: (block: TimeBlock) => void;
  onCopy: (block: TimeBlock) => void;
  onPaste: (date: Date, hour: number) => void;
  onDragStart: (block: TimeBlock, offsetMinutes: number, e: React.MouseEvent) => void;
  onResizeStart: (block: TimeBlock, e: React.MouseEvent) => void;
}

const DayColumn = ({
  date, blocks, continuationBlocks, categories, isToday, dragOverHour, isDragOver,
  draggingBlock, resizingBlock, resizePreviewEnd,
  onTimeSlotClick, onBlockClick, onCopy, onPaste, onDragStart, onResizeStart,
}: DayColumnProps) => {
  const handleContextMenu = (e: React.MouseEvent, hour: number) => {
    e.preventDefault();
    onPaste(date, hour);
  };

  return (
    <div className="flex-1 relative border-r border-cal-border last:border-r-0">
      {/* Hour slots */}
      {HOURS.map((hour) => (
        <div
          key={hour}
          style={{ height: `${HOUR_HEIGHT}px` }}
          className={`border-b border-cal-border cursor-pointer transition-colors
            ${isDragOver && dragOverHour === hour
              ? "bg-cal-primary/30"
              : "hover:bg-cal-hover/30"
            }`}
          onClick={() => onTimeSlotClick(date, hour)}
          onContextMenu={(e) => handleContextMenu(e, hour)}
        />
      ))}

      {/* Regular blocks */}
      {blocks.map((block) => (
        <TimeBlockItem
          key={block.id}
          block={block}
          categories={categories}
          isDragging={draggingBlock?.id === block.id}
          isResizing={resizingBlock?.id === block.id}
          resizePreviewEnd={resizingBlock?.id === block.id ? resizePreviewEnd : undefined}
          onClick={() => onBlockClick(block)}
          onCopy={onCopy}
          onDragStart={onDragStart}
          onResizeStart={onResizeStart}
        />
      ))}

      {/* Continuation blocks (blocks that started the previous day) */}
      {continuationBlocks.map((block) => (
        <TimeBlockItem
          key={`cont-${block.id}`}
          block={block}
          categories={categories}
          isContinuation
          onClick={() => onBlockClick(block)}
          onCopy={onCopy}
          onDragStart={onDragStart}
          onResizeStart={onResizeStart}
        />
      ))}

      {isToday && <CurrentTimeLine />}
    </div>
  );
};

// Main CalendarGrid
export const CalendarGrid = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const {
    currentDate, goToNextWeek, goToPrevWeek, goToToday,
    getBlocksForDate, isCreatingBlock, setIsCreatingBlock,
    editingBlockId, setEditingBlockId, selectedDate, setSelectedDate,
    blocks, fetchBlocks, addBlock, updateBlock, categories, fetchCategories,
  } = useCalendarStore();

  const [selectedHour, setSelectedHour] = useState<number | undefined>(undefined);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);

  // Copy/paste
  const [copiedBlock, setCopiedBlock] = useState<TimeBlock | null>(null);
  const [toast, setToast] = useState<{
    type: "copy" | "paste" | "error" | "collision";
    message: string;
  } | null>(null);

  // Drag state
  const [draggingBlock, setDraggingBlock] = useState<TimeBlock | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  // Resize state
  const [resizingBlock, setResizingBlock] = useState<TimeBlock | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeOriginalEnd, setResizeOriginalEnd] = useState("");
  const [resizePreviewEnd, setResizePreviewEnd] = useState("");

  // Refs for stale closure avoidance in event listeners
  const draggingBlockRef = useRef<TimeBlock | null>(null);
  const dragOverDateRef = useRef<Date | null>(null);
  const dragOverHourRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const resizingBlockRef = useRef<TimeBlock | null>(null);
  const resizeStartYRef = useRef(0);
  const resizeOriginalEndRef = useRef("");
  const blocksRef = useRef<TimeBlock[]>([]);
  const weekStartRef = useRef<Date>(new Date());

  // Keep refs in sync with state
  useEffect(() => { draggingBlockRef.current = draggingBlock; }, [draggingBlock]);
  useEffect(() => { dragOverDateRef.current = dragOverDate; }, [dragOverDate]);
  useEffect(() => { dragOverHourRef.current = dragOverHour; }, [dragOverHour]);
  useEffect(() => { resizingBlockRef.current = resizingBlock; }, [resizingBlock]);
  useEffect(() => { resizeStartYRef.current = resizeStartY; }, [resizeStartY]);
  useEffect(() => { resizeOriginalEndRef.current = resizeOriginalEnd; }, [resizeOriginalEnd]);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  useEffect(() => { fetchBlocks(); fetchCategories(); }, [fetchBlocks, fetchCategories]);

  useEffect(() => {
    if (editingBlockId) {
      setEditingBlock(blocks.find((b) => b.id === editingBlockId) || null);
    } else {
      setEditingBlock(null);
    }
  }, [editingBlockId, blocks]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  weekStartRef.current = weekStart;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dayName: format(date, "EEE", { locale: es }).toUpperCase(),
      dayNumber: date.getDate(),
      isToday: isSameDay(date, new Date()),
    };
  });

  const currentMonthYear = format(currentDate, "MMMM yyyy", { locale: es });

  // Scroll to 7am on mount — double rAF ensures the flex layout has painted
  // and the container has a real height before we assign scrollTop.
  useEffect(() => {
    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (gridRef.current) {
          gridRef.current.scrollTop = DEFAULT_START_HOUR * HOUR_HEIGHT;
        }
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────
  const showToast = (
    type: "copy" | "paste" | "error" | "collision",
    message: string
  ) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Grid coordinate helpers ────────────────────────────────────────
  /** Returns the Date for the column under the given clientX */
  const getDateFromMouseX = (clientX: number): Date | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const timeGutter = 64; // w-16
    const relX = clientX - rect.left - timeGutter;
    const colWidth = (rect.width - timeGutter) / 7;
    const colIndex = Math.floor(relX / colWidth);
    if (colIndex < 0 || colIndex > 6) return null;
    return addDays(weekStartRef.current, colIndex);
  };

  /** Returns the hour (0–23) under the cursor, adjusted for drag offset */
  const getHourFromMouseY = (clientY: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = gridRef.current.scrollTop;
    const relY = clientY - rect.top + scrollTop;
    const adjustedY = relY - (dragOffsetRef.current / 60) * HOUR_HEIGHT;
    return Math.max(0, Math.min(23, Math.floor(adjustedY / HOUR_HEIGHT)));
  };

  // ── Drag mouse events ──────────────────────────────────────────────
  useEffect(() => {
    if (!draggingBlock) return;

    const handleMouseMove = (e: MouseEvent) => {
      const date = getDateFromMouseX(e.clientX);
      const hour = getHourFromMouseY(e.clientY);
      setDragOverDate(date);
      setDragOverHour(hour);
    };

    const handleMouseUp = () => {
      const block = draggingBlockRef.current;
      const date = dragOverDateRef.current;
      const hour = dragOverHourRef.current;
      if (block && date && hour !== null) {
        executeDrop(block, date, hour);
      } else {
        setDraggingBlock(null);
        setDragOverDate(null);
        setDragOverHour(null);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingBlock]);

  const executeDrop = async (block: TimeBlock, date: Date, hour: number) => {
    const startMin = timeToMinutes(block.startTime);
    const endMin = timeToMinutes(block.endTime);
    const durationMinutes = endMin - startMin;

    // Snap destination to 15-minute grid
    const snappedStart = Math.round((hour * 60) / 15) * 15;
    const snappedEnd = Math.min(snappedStart + durationMinutes, 23 * 60 + 59);

    const targetDateStr = format(date, "yyyy-MM-dd");

    if (hasCollision(blocksRef.current, targetDateStr, snappedStart, snappedEnd, block.id)) {
      showToast("collision", "No se puede mover: hay un bloque en ese horario");
      setDraggingBlock(null);
      setDragOverDate(null);
      setDragOverHour(null);
      return;
    }

    try {
      await updateBlock(block.id, {
        date: targetDateStr,
        startTime: minutesToTime(snappedStart),
        endTime: minutesToTime(snappedEnd),
      });
    } catch {
      showToast("error", "Error al mover el bloque");
    } finally {
      setDraggingBlock(null);
      setDragOverDate(null);
      setDragOverHour(null);
    }
  };

  // ── Resize mouse events ────────────────────────────────────────────
  useEffect(() => {
    if (!resizingBlock) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizeStartYRef.current;
      const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15;
      const origEnd = timeToMinutes(resizeOriginalEndRef.current);
      const startMin = timeToMinutes(resizingBlockRef.current!.startTime);
      const newEnd = Math.max(
        startMin + MIN_BLOCK_MINUTES,
        Math.min(origEnd + deltaMinutes, 23 * 60 + 59)
      );
      setResizePreviewEnd(minutesToTime(newEnd));
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const block = resizingBlockRef.current!;
      const deltaY = e.clientY - resizeStartYRef.current;
      const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15;
      const origEnd = timeToMinutes(resizeOriginalEndRef.current);
      const startMin = timeToMinutes(block.startTime);
      const newEnd = Math.max(
        startMin + MIN_BLOCK_MINUTES,
        Math.min(origEnd + deltaMinutes, 23 * 60 + 59)
      );
      try {
        await updateBlock(block.id, { endTime: minutesToTime(newEnd) });
      } catch {
        showToast("error", "Error al redimensionar el bloque");
      } finally {
        setResizingBlock(null);
        setResizePreviewEnd("");
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizingBlock]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleTimeSlotClick = (date: Date, hour: number) => {
    if (draggingBlock || resizingBlock) return;
    setSelectedDate(date);
    setSelectedHour(hour);
    setIsCreatingBlock(true);
  };

  const handleBlockClick = (block: TimeBlock) => {
    if (draggingBlock || resizingBlock) return;
    setEditingBlockId(block.id);
  };

  const handleCloseModal = () => {
    setIsCreatingBlock(false);
    setEditingBlockId(null);
    setSelectedHour(undefined);
  };

  const handleCopy = (block: TimeBlock) => {
    setCopiedBlock(block);
    showToast("copy", `"${block.title}" copiado — clic derecho en celda para pegar`);
  };

  const handlePaste = async (date: Date, hour: number) => {
    if (!copiedBlock) return;
    const startMin = timeToMinutes(copiedBlock.startTime);
    const endMin = timeToMinutes(copiedBlock.endTime);
    const duration = endMin - startMin;
    const newStart = hour * 60;
    const newEnd = Math.min(newStart + duration, 23 * 60 + 59);
    const targetDateStr = format(date, "yyyy-MM-dd");

    if (hasCollision(blocks, targetDateStr, newStart, newEnd)) {
      showToast("collision", "No se puede pegar: hay un bloque en ese horario");
      return;
    }

    try {
      await addBlock({
        title: copiedBlock.title,
        date: targetDateStr,
        startTime: minutesToTime(newStart),
        endTime: minutesToTime(newEnd),
        type: copiedBlock.type,
        color: copiedBlock.color,
        categoryId: copiedBlock.categoryId,
        completed: false,
      });
      showToast("paste", `"${copiedBlock.title}" pegado`);
    } catch {
      showToast("error", "Error al pegar el bloque");
    }
  };

  const handleDragStart = (
    block: TimeBlock,
    offsetMinutes: number,
    _e: React.MouseEvent
  ) => {
    dragOffsetRef.current = offsetMinutes;
    setDraggingBlock(block);
  };

  const handleResizeStart = (block: TimeBlock, e: React.MouseEvent) => {
    setResizingBlock(block);
    setResizeStartY(e.clientY);
    setResizeOriginalEnd(block.endTime);
    setResizePreviewEnd(block.endTime);
  };

  // ── Drag preview ghost position ────────────────────────────────────
  const dragPreview = (() => {
    if (!draggingBlock || !dragOverDate || dragOverHour === null) return null;
    const colIndex = weekDays.findIndex((d) => isSameDay(d.date, dragOverDate));
    if (colIndex === -1) return null;
    if (!gridRef.current) return null;
    const gridWidth = gridRef.current.getBoundingClientRect().width;
    const timeGutter = 64;
    const colWidth = (gridWidth - timeGutter) / 7;
    const startMin = timeToMinutes(draggingBlock.startTime);
    const endMin = timeToMinutes(draggingBlock.endTime);
    const durationMinutes = endMin - startMin;
    const snappedStart = Math.round((dragOverHour * 60) / 15) * 15;
    return {
      top: (snappedStart / 60) * HOUR_HEIGHT,
      left: timeGutter + colIndex * colWidth + 4,
      width: colWidth - 8,
      height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20),
      timeLabel: minutesToTime(snappedStart),
    };
  })();

  // ── Multi-day continuation blocks ──────────────────────────────────
  /** For each day, find blocks from the previous day that cross midnight */
  const getContinuationBlocks = (date: Date): TimeBlock[] => {
    const prevDateStr = format(addDays(date, -1), "yyyy-MM-dd");
    return blocks.filter((b) => {
      if (b.date !== prevDateStr) return false;
      const startMin = timeToMinutes(b.startTime);
      const endMin = timeToMinutes(b.endTime);
      // Crosses midnight: endTime is earlier/equal to startTime
      return endMin <= startMin;
    });
  };

  // ── Toast styles ───────────────────────────────────────────────────
  const toastConfig = {
    copy:      { bg: "bg-blue-500/90",   icon: "content_copy" },
    paste:     { bg: "bg-green-500/90",  icon: "content_paste" },
    error:     { bg: "bg-red-500/90",    icon: "error" },
    collision: { bg: "bg-orange-500/90", icon: "block" },
  };

  return (
    <div className="flex flex-col h-full relative min-h-0">
      {/* Toast notification */}
      {toast && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 ${toastConfig[toast.type].bg}
            text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2
            animate-in fade-in slide-in-from-top-2 whitespace-nowrap`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastConfig[toast.type].icon}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Transparent drag/resize overlay to capture mouse events globally */}
      {(draggingBlock || resizingBlock) && (
        <div
          className="fixed inset-0 z-40"
          style={{
            cursor: draggingBlock ? "grabbing" : "ns-resize",
            background: "transparent",
          }}
        />
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cal-border shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white capitalize">
            {currentMonthYear}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevWeek}
              className="p-2 rounded-lg hover:bg-cal-hover text-gray-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-white bg-cal-border rounded-lg hover:bg-cal-hover transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-cal-hover text-gray-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Clipboard indicator */}
          {copiedBlock && (
            <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-cal-border px-3 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-sm">content_copy</span>
              &ldquo;{copiedBlock.title}&rdquo; listo para pegar
            </span>
          )}
          <button
            onClick={() => setIsCreatingBlock(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cal-primary text-white rounded-lg font-medium hover:bg-cal-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Nuevo evento
          </button>
        </div>
      </div>

      {/* Days header */}
      <div className="flex border-b border-cal-border shrink-0">
        <div className="w-16 shrink-0" />
        {weekDays.map(({ date, dayName, dayNumber, isToday }) => (
          <div
            key={date.toISOString()}
            className={`flex-1 py-3 text-center border-r border-cal-border last:border-r-0
              ${isToday ? "bg-cal-primary/10" : ""}`}
          >
            <p className={`text-xs font-medium ${isToday ? "text-cal-primary" : "text-gray-500"}`}>
              {dayName}
            </p>
            <p className={`text-lg font-bold ${isToday ? "text-cal-primary" : "text-white"}`}>
              {dayNumber}
            </p>
          </div>
        ))}
      </div>

      {/* Scrollable grid area */}
      <div ref={gridRef} className="flex-1 overflow-auto relative min-h-0">
        <div className="flex" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time labels */}
          <div className="w-16 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="pr-2 flex items-start justify-end"
              >
                <span className="text-xs text-gray-500 -mt-2">{formatHour(hour)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(({ date, isToday }) => {
            const isDragOver = !!(draggingBlock && dragOverDate && isSameDay(dragOverDate, date));
            return (
              <DayColumn
                key={date.toISOString()}
                date={date}
                blocks={getBlocksForDate(date)}
                continuationBlocks={getContinuationBlocks(date)}
                categories={categories}
                isToday={isToday}
                dragOverHour={isDragOver ? dragOverHour : null}
                isDragOver={isDragOver}
                draggingBlock={draggingBlock}
                resizingBlock={resizingBlock}
                resizePreviewEnd={resizePreviewEnd}
                onTimeSlotClick={handleTimeSlotClick}
                onBlockClick={handleBlockClick}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onDragStart={handleDragStart}
                onResizeStart={handleResizeStart}
              />
            );
          })}
        </div>

        {/* Drag preview ghost — positioned inside scrollable area */}
        {dragPreview && draggingBlock && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              top: `${dragPreview.top}px`,
              left: `${dragPreview.left}px`,
              width: `${dragPreview.width}px`,
              height: `${dragPreview.height}px`,
            }}
          >
            <div
              className={`w-full h-full rounded-md border-2 border-dashed border-cal-primary
                bg-cal-primary/20 px-2 py-1 overflow-hidden`}
            >
              <p className="text-xs font-medium text-white truncate">
                {draggingBlock.title}
              </p>
              <p className="text-[10px] text-gray-300">{dragPreview.timeLabel}</p>
            </div>
          </div>
        )}
      </div>

      {/* Block Modal */}
      <BlockModal
        isOpen={isCreatingBlock || !!editingBlockId}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        editingBlock={editingBlock}
      />
    </div>
  );
};
