import { create } from "zustand";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  addDays,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  calendarBlocksService,
  categoriesService,
  type CalendarBlock,
  type Category,
} from "../services/database";

export type BlockType = "deep-work" | "shallow-work" | "other";
export type BlockColor = "blue" | "red" | "yellow" | "pink" | "orange" | "gray";

// TimeBlock interface compatible with local state
export interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: BlockType;
  color?: BlockColor;
  categoryId?: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CalendarState {
  // Current view state
  currentDate: Date;
  selectedDate: Date | null;
  viewMode: "week" | "day" | "month";

  // Data
  blocks: TimeBlock[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // UI state
  isCreatingBlock: boolean;
  editingBlockId: string | null;

  // Navigation actions
  setCurrentDate: (date: Date) => void;
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
  goToToday: () => void;
  setViewMode: (mode: "week" | "day" | "month") => void;
  setSelectedDate: (date: Date | null) => void;

  // Data actions
  fetchBlocks: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addBlock: (
    block: Omit<TimeBlock, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;

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

// Convert DB block to TimeBlock
const dbBlockToTimeBlock = (dbBlock: CalendarBlock): TimeBlock => {
  // Parse as UTC timestamps and convert to local time
  const startDate = new Date(dbBlock.start_time);
  const endDate = new Date(dbBlock.end_time);

  return {
    id: dbBlock.id,
    title: dbBlock.title,
    date: format(startDate, "yyyy-MM-dd"),
    startTime: format(startDate, "HH:mm"),
    endTime: format(endDate, "HH:mm"),
    type:
      dbBlock.type === "deep"
        ? "deep-work"
        : dbBlock.type === "shallow"
          ? "shallow-work"
          : "other",
    color: dbBlock.color as BlockColor | undefined,
    categoryId: dbBlock.category_id,
    completed: false,
    createdAt: dbBlock.created_at,
    updatedAt: dbBlock.updated_at,
  };
};

// Convert TimeBlock to DB format
const timeBlockToDbBlock = (
  block: Omit<TimeBlock, "id" | "createdAt" | "updatedAt">,
) => {
  // Create Date objects in local timezone
  const startDate = new Date(`${block.date}T${block.startTime}:00`);
  const endDate = new Date(`${block.date}T${block.endTime}:00`);

  // Convert to ISO string (UTC) for database storage
  const startDateTime = startDate.toISOString();
  const endDateTime = endDate.toISOString();

  const dbType: "deep" | "shallow" | "other" =
    block.type === "deep-work"
      ? "deep"
      : block.type === "shallow-work"
        ? "shallow"
        : "other";

  return {
    title: block.title,
    type: dbType,
    category_id: block.categoryId || null,
    start_time: startDateTime,
    end_time: endDateTime,
    color: block.color || null,
  };
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  currentDate: new Date(),
  selectedDate: null,
  viewMode: "week",
  blocks: [],
  categories: [],
  isLoading: false,
  error: null,
  isCreatingBlock: false,
  editingBlockId: null,

  // Navigation actions
  setCurrentDate: (date) => set({ currentDate: date }),

  goToNextWeek: () => {
    const newDate = addWeeks(get().currentDate, 1);
    set({ currentDate: newDate });
    get().fetchBlocks();
  },

  goToPrevWeek: () => {
    const newDate = subWeeks(get().currentDate, 1);
    set({ currentDate: newDate });
    get().fetchBlocks();
  },

  goToToday: () => {
    set({ currentDate: new Date() });
    get().fetchBlocks();
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Data actions
  fetchBlocks: async () => {
    try {
      set({ isLoading: true, error: null });
      const { currentDate } = get();
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

      const dbBlocks = await calendarBlocksService.getByWeek(
        weekStart,
        weekEnd,
      );
      const blocks = dbBlocks.map(dbBlockToTimeBlock);

      set({ blocks, isLoading: false });
    } catch (error) {
      console.error("Error fetching blocks:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await categoriesService.getAll();
      set({ categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ error: (error as Error).message });
    }
  },

  addBlock: async (blockData) => {
    try {
      set({ isLoading: true, error: null });
      const dbInput = timeBlockToDbBlock(blockData);
      const dbBlock = await calendarBlocksService.create(dbInput);
      const newBlock = dbBlockToTimeBlock(dbBlock);

      set((state) => ({
        blocks: [...state.blocks, newBlock],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error adding block:", error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateBlock: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      // Convert updates to DB format
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.type) {
        dbUpdates.type =
          updates.type === "deep-work"
            ? "deep"
            : updates.type === "shallow-work"
              ? "shallow"
              : "other";
      }
      if (updates.color !== undefined) dbUpdates.color = updates.color || null;
      if (updates.categoryId !== undefined)
        dbUpdates.category_id = updates.categoryId || null;
      if (updates.date || updates.startTime || updates.endTime) {
        const block = get().blocks.find((b) => b.id === id);
        if (block) {
          const date = updates.date || block.date;
          const startTime = updates.startTime || block.startTime;
          const endTime = updates.endTime || block.endTime;
          // Create Date objects in local timezone and convert to ISO (UTC) for DB
          const startDate = new Date(`${date}T${startTime}:00`);
          const endDate = new Date(`${date}T${endTime}:00`);
          dbUpdates.start_time = startDate.toISOString();
          dbUpdates.end_time = endDate.toISOString();
        }
      }

      const dbBlock = await calendarBlocksService.update(id, dbUpdates);
      const updatedBlock = dbBlockToTimeBlock(dbBlock);

      set((state) => ({
        blocks: state.blocks.map((b) => (b.id === id ? updatedBlock : b)),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error updating block:", error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteBlock: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await calendarBlocksService.delete(id);

      set((state) => ({
        blocks: state.blocks.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error deleting block:", error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // UI actions
  setIsCreatingBlock: (isCreating) => set({ isCreatingBlock: isCreating }),
  setEditingBlockId: (id) => set({ editingBlockId: id }),

  // Getters
  getWeekDays: () => {
    const { currentDate } = get();
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

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
}));

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
