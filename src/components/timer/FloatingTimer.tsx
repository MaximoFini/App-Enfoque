import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFloatingTimerStore } from "../../store/floatingTimerStore";
import { useGlobalTimerStore } from "../../store/globalTimerStore";

const FloatingTimerWidget = () => {
  const { isMinimized, source, position, restore, setPosition } =
    useFloatingTimerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Get timer state from global store
  const globalTimer = useGlobalTimerStore();

  // Determine which timer to show
  const isPomodoro = source === "pomodoro";
  const isFocus = source === "focus";

  // Tiempo restante en segundos
  const timeRemaining = Math.ceil(globalTimer.timeRemainingMs / 1000);

  const isRunning = globalTimer.status === "running";

  const currentMode = isPomodoro ? globalTimer.pomodoroMode : null;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get display title and color
  const getTimerInfo = () => {
    if (isPomodoro) {
      if (currentMode === "break") {
        return {
          title: "Descanso",
          icon: "coffee",
          color: "#10B981", // green
        };
      }
      return {
        title: "Pomodoro",
        icon: "timer",
        color: "#8B5CF6", // violet
      };
    }
    if (isFocus) {
      return {
        title:
          globalTimer.focusConfig.focusType === "deep"
            ? "Deep Work"
            : "Shallow Work",
        icon: "center_focus_strong",
        color:
          globalTimer.focusConfig.focusType === "deep" ? "#8B5CF6" : "#10B981",
      };
    }
    return { title: "", icon: "", color: "#8B5CF6" };
  };

  const timerInfo = getTimerInfo();

  // Handle play/pause
  const handlePlayPause = () => {
    if (isRunning) {
      globalTimer.pause();
    } else if (globalTimer.status === "paused") {
      globalTimer.resume();
    } else if (isPomodoro) {
      globalTimer.startPomodoro();
    } else if (isFocus) {
      globalTimer.startFocus();
    }
  };

  // Handle reset
  const handleReset = () => {
    globalTimer.reset();
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;

    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const maxX = window.innerWidth - 280;
      const maxY = window.innerHeight - 200;

      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      setPosition(constrainedX, constrainedY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // Optional: Snap to edges if close
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        const snapThreshold = 50;

        let finalX = position.x;
        let finalY = position.y;

        // Snap to left/right edges
        if (rect.left < snapThreshold) {
          finalX = 20;
        } else if (window.innerWidth - rect.right < snapThreshold) {
          finalX = window.innerWidth - rect.width - 20;
        }

        // Snap to top/bottom edges
        if (rect.top < snapThreshold) {
          finalY = 20;
        } else if (window.innerHeight - rect.bottom < snapThreshold) {
          finalY = window.innerHeight - rect.height - 20;
        }

        if (finalX !== position.x || finalY !== position.y) {
          setPosition(finalX, finalY);
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, position, setPosition]);

  // Handle ESC key to restore
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMinimized) {
        restore();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMinimized, restore]);

  if (!isMinimized || !source) return null;

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 bg-[#1D1829] border-2 rounded-2xl shadow-2xl transition-shadow ${
        isDragging ? "shadow-3xl cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "280px",
        borderColor: timerInfo.color,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E2640]">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ color: timerInfo.color }}
          >
            {timerInfo.icon}
          </span>
          <span className="text-sm font-medium text-white">
            {timerInfo.title}
          </span>
        </div>
        <button
          onClick={restore}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#2E2640] transition-colors"
          aria-label="Restaurar temporizador"
          title="Restaurar (ESC)"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Timer Display */}
      <div className="px-6 py-6">
        <div
          className="text-5xl font-bold text-center font-mono"
          style={{ color: timerInfo.color }}
        >
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 pb-6">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
          style={{ backgroundColor: timerInfo.color }}
          aria-label={isRunning ? "Pausar" : "Reproducir"}
          title={isRunning ? "Pausar" : "Reproducir"}
        >
          <span className="material-symbols-outlined text-[28px]">
            {isRunning ? "pause" : "play_arrow"}
          </span>
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-full bg-[#2E2640] text-gray-400 hover:text-white hover:bg-[#3E3650] transition-all flex items-center justify-center"
          aria-label="Reiniciar"
          title="Reiniciar"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      {/* Drag indicator (subtle dots) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-30">
        <div className="w-1 h-1 rounded-full bg-white" />
        <div className="w-1 h-1 rounded-full bg-white" />
        <div className="w-1 h-1 rounded-full bg-white" />
      </div>
    </div>
  );
};

// Portal wrapper
export const FloatingTimer = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<FloatingTimerWidget />, document.body);
};
