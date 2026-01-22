import { useEffect, useState, useRef } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  useCalendarStore,
  getBlockStyles,
  calculateBlockPosition,
  TimeBlock,
} from "../../store/calendarStoreNew";
import { BlockModal } from "./BlockModal";

// Hours array from 0 to 23
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Height per hour in pixels (compressed view)
const HOUR_HEIGHT = 40;

// Default visible range (7am to 9pm = 14 hours)
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 21;

// Format hour for display
const formatHour = (hour: number) => {
  return `${hour.toString().padStart(2, "0")}:00`;
};

// Current time line component
const CurrentTimeLine = () => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setPosition((minutes / 60) * HOUR_HEIGHT); // Scale to HOUR_HEIGHT per hour
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute

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
  onClick: () => void;
  onCopy: (block: TimeBlock) => void;
  onDragStart: (block: TimeBlock) => void;
  onResizeStart: (block: TimeBlock, e: React.MouseEvent) => void;
}

const TimeBlockItem = ({
  block,
  onClick,
  onCopy,
  onDragStart,
  onResizeStart,
}: TimeBlockItemProps) => {
  const { top, height } = calculateBlockPosition(
    block.startTime,
    block.endTime,
  );
  const styles = getBlockStyles(block.type, block.color);
  const [isHoveringBottom, setIsHoveringBottom] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "c") {
      e.preventDefault();
      e.stopPropagation();
      onCopy(block);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const distanceFromBottom = rect.bottom - e.clientY;
    // Increase detection zone to 16px for easier resize targeting
    setIsHoveringBottom(distanceFromBottom < 16);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHoveringBottom) {
      e.stopPropagation();
      e.preventDefault();
      onResizeStart(block, e);
    } else {
      // Check if it's a drag intent (mouse moved while down)
      const startX = e.clientX;
      const startY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const distance = Math.sqrt(
          Math.pow(moveEvent.clientX - startX, 2) +
            Math.pow(moveEvent.clientY - startY, 2),
        );
        if (distance > 5) {
          document.removeEventListener("mousemove", handleMouseMove);
          onDragStart(block);
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCopy(block);
  };

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 cursor-pointer group
        ${styles.bg} ${styles.border} hover:opacity-80 transition-opacity overflow-hidden
        ${isHoveringBottom ? "cursor-ns-resize" : "cursor-move"}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: "20px",
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseLeave={() => setIsHoveringBottom(false)}
      onContextMenu={handleContextMenu}
      tabIndex={0}
    >
      {/* Resize handle visual indicator */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center transition-opacity
          ${isHoveringBottom ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}
      >
        <div className="w-8 h-1 bg-white/40 rounded-full" />
      </div>
      <p className={`text-xs font-medium truncate ${styles.text}`}>
        {block.title}
      </p>
      {height >= 40 && (
        <p className="text-[10px] text-gray-400 truncate">
          {block.startTime} - {block.endTime}
        </p>
      )}
    </div>
  );
};

// Day column component
interface DayColumnProps {
  date: Date;
  blocks: TimeBlock[];
  isToday: boolean;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onBlockClick: (block: TimeBlock) => void;
  onCopy: (block: TimeBlock) => void;
  onPaste: (date: Date, hour: number) => void;
  onDragStart: (block: TimeBlock) => void;
  onDragOver: (date: Date, hour: number) => void;
  onDrop: (date: Date, hour: number) => void;
  onResizeStart: (block: TimeBlock, e: React.MouseEvent) => void;
  isDragOver?: boolean;
}

const DayColumn = ({
  date,
  blocks,
  isToday,
  onTimeSlotClick,
  onBlockClick,
  onCopy,
  onPaste,
  onDragStart,
  onDragOver,
  onDrop,
  onResizeStart,
  isDragOver,
}: DayColumnProps) => {
  const handleKeyDown = (e: React.KeyboardEvent, hour: number) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      e.preventDefault();
      onPaste(date, hour);
    }
  };

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
          className={`border-b border-cal-border hover:bg-cal-hover/30 cursor-pointer transition-colors
            ${isDragOver ? "bg-cal-primary/20" : ""}`}
          onClick={() => onTimeSlotClick(date, hour)}
          onKeyDown={(e) => handleKeyDown(e, hour)}
          onContextMenu={(e) => handleContextMenu(e, hour)}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(date, hour);
          }}
          onDrop={(e) => {
            e.preventDefault();
            onDrop(date, hour);
          }}
          tabIndex={0}
        />
      ))}

      {/* Time blocks */}
      {blocks.map((block) => (
        <TimeBlockItem
          key={block.id}
          block={block}
          onClick={() => onBlockClick(block)}
          onCopy={onCopy}
          onDragStart={onDragStart}
          onResizeStart={onResizeStart}
        />
      ))}

      {/* Current time line (only show on today's column) */}
      {isToday && <CurrentTimeLine />}
    </div>
  );
};

// Main Calendar Grid
export const CalendarGrid = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const {
    currentDate,
    goToNextWeek,
    goToPrevWeek,
    goToToday,
    getBlocksForDate,
    isCreatingBlock,
    setIsCreatingBlock,
    editingBlockId,
    setEditingBlockId,
    selectedDate,
    setSelectedDate,
    blocks,
    fetchBlocks,
    addBlock,
    updateBlock,
  } = useCalendarStore();

  // Local state for modal
  const [selectedHour, setSelectedHour] = useState<number | undefined>(
    undefined,
  );
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);

  // Copy/paste state
  const [copiedBlock, setCopiedBlock] = useState<TimeBlock | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Drag state
  const [draggingBlock, setDraggingBlock] = useState<TimeBlock | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [dragMouseY, setDragMouseY] = useState<number>(0);

  // Resize state
  const [resizingBlock, setResizingBlock] = useState<TimeBlock | null>(null);
  const [resizeStartY, setResizeStartY] = useState<number>(0);
  const [resizeOriginalEnd, setResizeOriginalEnd] = useState<string>("");

  // Fetch blocks on mount and when week changes
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Find block being edited
  useEffect(() => {
    if (editingBlockId) {
      const block = blocks.find((b) => b.id === editingBlockId);
      setEditingBlock(block || null);
    } else {
      setEditingBlock(null);
    }
  }, [editingBlockId, blocks]);

  // Get week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dayName: format(date, "EEE", { locale: es }).toUpperCase(),
      dayNumber: date.getDate(),
      monthName: format(date, "MMM", { locale: es }),
      isToday: isSameDay(date, new Date()),
    };
  });

  // Get current month/year for header
  const currentMonthYear = format(currentDate, "MMMM yyyy", { locale: es });

  // Scroll to 7am on mount (Google Calendar style)
  useEffect(() => {
    if (gridRef.current) {
      // Always scroll to 7am when calendar opens
      // User can scroll up to see earlier hours (00:00-07:00)
      gridRef.current.scrollTop = DEFAULT_START_HOUR * HOUR_HEIGHT;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run only once on mount

  // Global drag tracking effect
  useEffect(() => {
    if (!draggingBlock) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragMouseY(e.clientY);

      // Find which day column we're over
      if (gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const scrollTop = gridRef.current.scrollTop;
        const relativeY = e.clientY - gridRect.top + scrollTop;
        const hour = Math.floor(relativeY / HOUR_HEIGHT);
        setDragOverHour(Math.max(0, Math.min(23, hour)));
      }
    };

    const handleMouseUp = () => {
      if (draggingBlock && dragOverDate && dragOverHour !== null) {
        // Execute the drop
        executeDrop(dragOverDate, dragOverHour);
      } else {
        // Cancel drag
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
  }, [draggingBlock, dragOverDate, dragOverHour]);

  const handleTimeSlotClick = (date: Date, hour: number) => {
    // Don't open modal if we're dragging
    if (draggingBlock) return;
    setSelectedDate(date);
    setSelectedHour(hour);
    setIsCreatingBlock(true);
  };

  const handleBlockClick = (block: TimeBlock) => {
    // Don't open modal if we're dragging
    if (draggingBlock) return;
    setEditingBlockId(block.id);
  };

  const handleCloseModal = () => {
    setIsCreatingBlock(false);
    setEditingBlockId(null);
    setSelectedHour(undefined);
  };

  // Copy/Paste handlers
  const handleCopy = (block: TimeBlock) => {
    setCopiedBlock(block);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 2000);
    console.log("Block copied:", block.title);
  };

  const handlePaste = async (date: Date, hour: number) => {
    if (!copiedBlock) return;

    // Calculate duration
    const [startH, startM] = copiedBlock.startTime.split(":").map(Number);
    const [endH, endM] = copiedBlock.endTime.split(":").map(Number);
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM);

    // New start time
    const newStartH = hour.toString().padStart(2, "0");
    const newStartM = "00";
    const newStartTime = `${newStartH}:${newStartM}`;

    // Calculate new end time
    const endMinutes = hour * 60 + durationMinutes;
    const newEndH = Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0");
    const newEndM = (endMinutes % 60).toString().padStart(2, "0");
    const newEndTime = `${newEndH}:${newEndM}`;

    // Create new block
    try {
      await addBlock({
        title: copiedBlock.title,
        date: format(date, "yyyy-MM-dd"),
        startTime: newStartTime,
        endTime: newEndTime,
        type: copiedBlock.type,
        color: copiedBlock.color,
        categoryId: copiedBlock.categoryId,
        completed: false,
      });
      console.log("Block pasted successfully");
    } catch (error) {
      console.error("Error pasting block:", error);
    }
  };

  // Drag handlers
  const handleDragStart = (block: TimeBlock) => {
    setDraggingBlock(block);
    console.log("Drag started:", block.title);
  };

  const handleDragOver = (date: Date, hour: number) => {
    if (draggingBlock) {
      setDragOverDate(date);
      setDragOverHour(hour);
    }
  };

  const executeDrop = async (date: Date, hour: number) => {
    if (!draggingBlock) return;

    // Calculate duration
    const [startH, startM] = draggingBlock.startTime.split(":").map(Number);
    const [endH, endM] = draggingBlock.endTime.split(":").map(Number);
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM);

    // Round to nearest 15 minutes
    const roundedMinutes = Math.round((hour * 60) / 15) * 15;
    const newStartH = Math.floor(roundedMinutes / 60)
      .toString()
      .padStart(2, "0");
    const newStartM = (roundedMinutes % 60).toString().padStart(2, "0");
    const newStartTime = `${newStartH}:${newStartM}`;

    // Calculate new end time
    const endMinutes = roundedMinutes + durationMinutes;
    const newEndH = Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0");
    const newEndM = (endMinutes % 60).toString().padStart(2, "0");
    const newEndTime = `${newEndH}:${newEndM}`;

    try {
      await updateBlock(draggingBlock.id, {
        date: format(date, "yyyy-MM-dd"),
        startTime: newStartTime,
        endTime: newEndTime,
      });
      console.log("Block moved successfully");
    } catch (error) {
      console.error("Error moving block:", error);
    } finally {
      setDraggingBlock(null);
      setDragOverDate(null);
      setDragOverHour(null);
    }
  };

  const handleDrop = (date: Date, hour: number) => {
    executeDrop(date, hour);
  };

  // Resize handlers
  const handleResizeStart = (block: TimeBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingBlock(block);
    setResizeStartY(e.clientY);
    setResizeOriginalEnd(block.endTime);
  };

  useEffect(() => {
    if (!resizingBlock) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizeStartY;
      const deltaMinutes = Math.round(((deltaY / HOUR_HEIGHT) * 60) / 15) * 15; // Round to 15 min

      const [endH, endM] = resizeOriginalEnd.split(":").map(Number);
      const newEndMinutes = endH * 60 + endM + deltaMinutes;

      // Ensure new end time is after start time
      const [startH, startM] = resizingBlock.startTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;

      if (newEndMinutes <= startMinutes) return; // Don't allow resize past start time

      const newEndH = Math.floor(newEndMinutes / 60)
        .toString()
        .padStart(2, "0");
      const newEndM = (newEndMinutes % 60).toString().padStart(2, "0");

      // Update block optimistically in UI (you could add local state for preview)
      console.log("Resizing to:", `${newEndH}:${newEndM}`);
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const deltaY = e.clientY - resizeStartY;
      const deltaMinutes = Math.round(((deltaY / HOUR_HEIGHT) * 60) / 15) * 15;

      const [endH, endM] = resizeOriginalEnd.split(":").map(Number);
      const newEndMinutes = endH * 60 + endM + deltaMinutes;

      const [startH, startM] = resizingBlock.startTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;

      if (newEndMinutes > startMinutes) {
        const newEndH = Math.floor(newEndMinutes / 60)
          .toString()
          .padStart(2, "0");
        const newEndM = (newEndMinutes % 60).toString().padStart(2, "0");
        const newEndTime = `${newEndH}:${newEndM}`;

        try {
          await updateBlock(resizingBlock.id, { endTime: newEndTime });
          console.log("Block resized successfully");
        } catch (error) {
          console.error("Error resizing block:", error);
        }
      }

      setResizingBlock(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingBlock, resizeStartY, resizeOriginalEnd, updateBlock]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Copy toast notification */}
      {showCopiedToast && copiedBlock && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-lg">
            content_copy
          </span>
          <span className="text-sm font-medium">
            "{copiedBlock.title}" copiado - Clic derecho para pegar
          </span>
        </div>
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
              <span className="material-symbols-outlined text-xl">
                chevron_left
              </span>
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
              <span className="material-symbols-outlined text-xl">
                chevron_right
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex bg-cal-border rounded-lg p-1">
            <button className="px-3 py-1.5 text-sm font-medium text-gray-400 rounded-md hover:text-white transition-colors">
              Día
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white bg-cal-primary rounded-md">
              Semana
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-400 rounded-md hover:text-white transition-colors">
              Mes
            </button>
          </div>

          {/* New Event Button */}
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
        {/* Time gutter */}
        <div className="w-16 shrink-0" />

        {/* Day headers */}
        {weekDays.map(({ date, dayName, dayNumber, isToday }) => (
          <div
            key={date.toISOString()}
            className={`flex-1 py-3 text-center border-r border-cal-border last:border-r-0
              ${isToday ? "bg-cal-primary/10" : ""}`}
          >
            <p
              className={`text-xs font-medium ${isToday ? "text-cal-primary" : "text-gray-500"}`}
            >
              {dayName}
            </p>
            <p
              className={`text-lg font-bold ${isToday ? "text-cal-primary" : "text-white"}`}
            >
              {dayNumber}
            </p>
          </div>
        ))}
      </div>

      {/* Scrollable grid area */}
      <div ref={gridRef} className="flex-1 overflow-auto">
        <div className="flex" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time labels column */}
          <div className="w-16 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="pr-2 flex items-start justify-end"
              >
                <span className="text-xs text-gray-500 -mt-2">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(({ date, isToday }) => {
            const isDragOver =
              draggingBlock && dragOverDate && isSameDay(dragOverDate, date);
            return (
              <DayColumn
                key={date.toISOString()}
                date={date}
                blocks={getBlocksForDate(date)}
                isToday={isToday}
                onTimeSlotClick={handleTimeSlotClick}
                onBlockClick={handleBlockClick}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onResizeStart={handleResizeStart}
                isDragOver={isDragOver}
              />
            );
          })}

          {/* Drag preview indicator */}
          {draggingBlock && dragOverHour !== null && (
            <div
              className="absolute pointer-events-none z-50"
              style={{
                top: `${dragOverHour * HOUR_HEIGHT}px`,
                left: "64px",
                right: "0",
              }}
            >
              <div className="mx-auto w-full max-w-xs bg-cal-primary/30 border-2 border-cal-primary border-dashed rounded-md p-2">
                <p className="text-xs font-medium text-white truncate">
                  {draggingBlock.title}
                </p>
                <p className="text-[10px] text-gray-300">
                  {dragOverHour.toString().padStart(2, "0")}:00
                </p>
              </div>
            </div>
          )}
        </div>
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
