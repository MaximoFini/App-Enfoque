import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  addDays,
  isToday,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";

export type BlockType = "deep-work" | "shallow-work" | "other";
export type BlockColor = "blue" | "red" | "yellow" | "pink" | "orange" | "gray";

export interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: BlockType;
  color?: BlockColor; // Only used when type is 'other'
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CalendarState {
  // Current view state
  currentDate: Date;
  selectedDate: Date | null;
  viewMode: "week" | "day" | "month";

  // Time blocks
  blocks: TimeBlock[];

  // UI state
  isCreatingBlock: boolean;
  editingBlockId: string | null;

  // Actions
  setCurrentDate: (date: Date) => void;
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
  goToToday: () => void;
  setViewMode: (mode: "week" | "day" | "month") => void;
  setSelectedDate: (date: Date | null) => void;

  // Block actions
  addBlock: (block: Omit<TimeBlock, "id" | "createdAt" | "updatedAt">) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  toggleBlockComplete: (id: string) => void;

  // UI actions
  setIsCreatingBlock: (isCreating: boolean) => void;
  setEditingBlockId: (id: string | null) => void;

  // Getters
  getWeekDays: () => {
    date: Date;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
  }[];
  getBlocksForDate: (date: Date) => TimeBlock[];
  getBlocksForWeek: () => Map<string, TimeBlock[]>;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentDate: new Date(),
      selectedDate: null,
      viewMode: "week",
      blocks: [],
      isCreatingBlock: false,
      editingBlockId: null,

      // Navigation actions
      setCurrentDate: (date) => set({ currentDate: date }),

      goToNextWeek: () =>
        set((state) => ({
          currentDate: addWeeks(state.currentDate, 1),
        })),

      goToPrevWeek: () =>
        set((state) => ({
          currentDate: subWeeks(state.currentDate, 1),
        })),

      goToToday: () => set({ currentDate: new Date() }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setSelectedDate: (date) => set({ selectedDate: date }),

      // Block actions
      addBlock: (blockData) =>
        set((state) => {
          const now = new Date().toISOString();
          const newBlock: TimeBlock = {
            ...blockData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };
          return { blocks: [...state.blocks, newBlock] };
        }),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? { ...block, ...updates, updatedAt: new Date().toISOString() }
              : block,
          ),
        })),

      deleteBlock: (id) =>
        set((state) => ({
          blocks: state.blocks.filter((block) => block.id !== id),
        })),

      toggleBlockComplete: (id) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  completed: !block.completed,
                  updatedAt: new Date().toISOString(),
                }
              : block,
          ),
        })),

      // UI actions
      setIsCreatingBlock: (isCreating) => set({ isCreatingBlock: isCreating }),
      setEditingBlockId: (id) => set({ editingBlockId: id }),

      // Getters
      getWeekDays: () => {
        const { currentDate } = get();
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

        return Array.from({ length: 7 }, (_, i) => {
          const date = addDays(weekStart, i);
          return {
            date,
            dayName: format(date, "EEE", { locale: es }),
            dayNumber: date.getDate(),
            isToday: isToday(date),
          };
        });
      },

      getBlocksForDate: (date) => {
        const { blocks } = get();
        const dateStr = format(date, "yyyy-MM-dd");
        return blocks.filter((block) => block.date === dateStr);
      },

      getBlocksForWeek: () => {
        const { blocks, currentDate } = get();
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

        const blocksByDate = new Map<string, TimeBlock[]>();

        blocks.forEach((block) => {
          const blockDate = new Date(block.date);
          if (blockDate >= weekStart && blockDate <= weekEnd) {
            const dateKey = block.date;
            const existing = blocksByDate.get(dateKey) || [];
            blocksByDate.set(dateKey, [...existing, block]);
          }
        });

        return blocksByDate;
      },
    }),
    {
      name: "enfoque-calendar-storage",
      partialize: (state) => ({ blocks: state.blocks }),
    },
  ),
);

// Helper function to get block style based on type
export const getBlockStyles = (type: BlockType, color?: BlockColor) => {
  if (type === "deep-work") {
    return {
      bg: "bg-deep-work/20",
      border: "border-l-deep-work",
      text: "text-deep-work",
    };
  }
  if (type === "shallow-work") {
    return {
      bg: "bg-shallow-work/20",
      border: "border-l-shallow-work",
      text: "text-shallow-work",
    };
  }

  // For 'other' type, use the specified color
  const colorMap: Record<
    BlockColor,
    { bg: string; border: string; text: string }
  > = {
    blue: {
      bg: "bg-block-blue/20",
      border: "border-l-block-blue",
      text: "text-block-blue",
    },
    red: {
      bg: "bg-block-red/20",
      border: "border-l-block-red",
      text: "text-block-red",
    },
    yellow: {
      bg: "bg-block-yellow/20",
      border: "border-l-block-yellow",
      text: "text-block-yellow",
    },
    pink: {
      bg: "bg-block-pink/20",
      border: "border-l-block-pink",
      text: "text-block-pink",
    },
    orange: {
      bg: "bg-block-orange/20",
      border: "border-l-block-orange",
      text: "text-block-orange",
    },
    gray: {
      bg: "bg-block-gray/20",
      border: "border-l-block-gray",
      text: "text-block-gray",
    },
  };

  return colorMap[color || "blue"];
};

// Height per hour in pixels (must match CalendarGrid)
const HOUR_HEIGHT = 40;

// Helper to calculate block position and height
export const calculateBlockPosition = (startTime: string, endTime: string) => {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const duration = endMinutes - startMinutes;

  // Scale to HOUR_HEIGHT per hour (HOUR_HEIGHT / 60 per minute)
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max((duration / 60) * HOUR_HEIGHT, 15); // Minimum 15px height

  return { top, height };
};
