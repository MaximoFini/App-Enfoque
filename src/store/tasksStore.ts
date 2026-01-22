import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";

export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category_id: string | null;
  priority: TaskPriority;
  due_date: string | null;
  completed: boolean;
  parent_task_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Local state for UI
  subtasks?: Task[];
  isExpanded?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

interface TasksState {
  tasks: Task[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Filter state - using object for easier consumption
  categoryVisibility: Record<string, boolean>;

  // Modal state
  isModalOpen: boolean;
  editingTask: Task | null;
  parentTaskId: string | null;
  createModalCategoryId: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchCategories: () => Promise<void>;

  addTask: (
    task: Omit<
      Task,
      "id" | "user_id" | "created_at" | "updated_at" | "order_index"
    >,
  ) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;

  // Category visibility
  toggleCategoryVisibility: (categoryId: string) => void;

  // Modal actions
  openCreateModal: (
    categoryId?: string | null,
    parentTaskId?: string | null,
  ) => void;
  openEditModal: (task: Task) => void;
  closeModal: () => void;

  // Local UI state
  toggleTaskExpanded: (taskId: string) => void;

  // Helpers
  getTasksByCategory: (categoryId: string) => {
    pending: Task[];
    completed: Task[];
  };
  getSubtasks: (parentId: string) => Task[];
}

// Build task tree with subtasks
const buildTaskTree = (tasks: Task[]): Task[] => {
  const taskMap = new Map<string, Task>();
  const rootTasks: Task[] = [];

  // First pass: create map
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, subtasks: [], isExpanded: true });
  });

  // Second pass: build tree
  tasks.forEach((task) => {
    const taskWithSubs = taskMap.get(task.id)!;
    if (task.parent_task_id) {
      const parent = taskMap.get(task.parent_task_id);
      if (parent) {
        parent.subtasks = parent.subtasks || [];
        parent.subtasks.push(taskWithSubs);
      }
    } else {
      rootTasks.push(taskWithSubs);
    }
  });

  // Sort by order_index
  const sortTasks = (taskList: Task[]): Task[] => {
    return taskList
      .sort((a, b) => a.order_index - b.order_index)
      .map((t) => ({
        ...t,
        subtasks: t.subtasks ? sortTasks(t.subtasks) : [],
      }));
  };

  return sortTasks(rootTasks);
};

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: [],
      isLoading: false,
      error: null,

      categoryVisibility: {},

      isModalOpen: false,
      editingTask: null,
      parentTaskId: null,
      createModalCategoryId: null,

      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .order("order_index", { ascending: true });

          if (error) throw error;

          // Build tree for UI purposes (not stored, just for processing)
          buildTaskTree(data || []);
          set({ tasks: data || [], isLoading: false });
        } catch (error) {
          console.error("Error fetching tasks:", error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      fetchCategories: async () => {
        try {
          const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name");

          if (error) throw error;

          const categories = data || [];

          // Merge with existing visibility state
          const currentVisibility = get().categoryVisibility;
          const newVisibility: Record<string, boolean> = {};

          categories.forEach((c) => {
            // Keep existing value if present, default to true for new categories
            newVisibility[c.id] = currentVisibility[c.id] ?? true;
          });

          set({
            categories,
            categoryVisibility: newVisibility,
          });
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      },

      addTask: async (taskData) => {
        set({ isLoading: true, error: null });
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          // Get max order_index for this category
          const { data: existingTasks } = await supabase
            .from("tasks")
            .select("order_index")
            .eq("category_id", taskData.category_id)
            .is("parent_task_id", taskData.parent_task_id)
            .order("order_index", { ascending: false })
            .limit(1);

          const maxOrder = existingTasks?.[0]?.order_index ?? -1;

          const { data, error } = await supabase
            .from("tasks")
            .insert({
              user_id: user.id,
              ...taskData,
              order_index: maxOrder + 1,
            })
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            tasks: [...state.tasks, data],
            isLoading: false,
          }));

          return data;
        } catch (error) {
          console.error("Error adding task:", error);
          set({ error: (error as Error).message, isLoading: false });
          return null;
        }
      },

      updateTask: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from("tasks")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, ...data } : t,
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error updating task:", error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      deleteTask: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Delete will cascade to subtasks due to DB constraint
          const { error } = await supabase.from("tasks").delete().eq("id", id);

          if (error) throw error;

          // Remove task and all its subtasks from local state
          const removeTaskAndChildren = (
            tasks: Task[],
            targetId: string,
          ): Task[] => {
            return tasks.filter((t) => {
              if (t.id === targetId) return false;
              if (t.parent_task_id === targetId) return false;
              return true;
            });
          };

          set((state) => ({
            tasks: removeTaskAndChildren(state.tasks, id),
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error deleting task:", error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      toggleComplete: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        try {
          const newCompleted = !task.completed;

          // If completing, move to end of category
          let newOrderIndex = task.order_index;
          if (newCompleted) {
            const { data: maxOrderData } = await supabase
              .from("tasks")
              .select("order_index")
              .eq("category_id", task.category_id)
              .eq("completed", true)
              .order("order_index", { ascending: false })
              .limit(1);

            newOrderIndex = (maxOrderData?.[0]?.order_index ?? 999) + 1;
          }

          const { error } = await supabase
            .from("tasks")
            .update({ completed: newCompleted, order_index: newOrderIndex })
            .eq("id", id);

          if (error) throw error;

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, completed: newCompleted, order_index: newOrderIndex }
                : t,
            ),
          }));
        } catch (error) {
          console.error("Error toggling complete:", error);
        }
      },

      toggleCategoryVisibility: (categoryId) => {
        set((state) => ({
          categoryVisibility: {
            ...state.categoryVisibility,
            [categoryId]: !state.categoryVisibility[categoryId],
          },
        }));
      },

      openCreateModal: (categoryId = null, parentTaskId = null) => {
        set({
          isModalOpen: true,
          editingTask: null,
          createModalCategoryId: categoryId,
          parentTaskId,
        });
      },

      openEditModal: (task) => {
        set({
          isModalOpen: true,
          editingTask: task,
          createModalCategoryId: task.category_id,
          parentTaskId: task.parent_task_id,
        });
      },

      closeModal: () => {
        set({
          isModalOpen: false,
          editingTask: null,
          createModalCategoryId: null,
          parentTaskId: null,
        });
      },

      toggleTaskExpanded: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, isExpanded: !t.isExpanded } : t,
          ),
        }));
      },

      getTasksByCategory: (categoryId) => {
        const tasks = get().tasks.filter(
          (t) => t.category_id === categoryId && !t.parent_task_id,
        );
        return {
          pending: tasks
            .filter((t) => !t.completed)
            .sort((a, b) => a.order_index - b.order_index),
          completed: tasks
            .filter((t) => t.completed)
            .sort((a, b) => a.order_index - b.order_index),
        };
      },

      getSubtasks: (parentId) => {
        return get()
          .tasks.filter((t) => t.parent_task_id === parentId)
          .sort((a, b) => a.order_index - b.order_index);
      },
    }),
    {
      name: "tasks-storage",
      partialize: (state) => ({
        categoryVisibility: state.categoryVisibility,
      }),
    },
  ),
);
