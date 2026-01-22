import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;

  // Actions
  fetchCategories: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<Category | null>;
  updateCategory: (
    id: string,
    updates: { name?: string; color?: string },
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Modal actions
  openModal: () => void;
  closeModal: () => void;
}

// Predefined colors for categories
export const CATEGORY_COLORS = [
  { name: "Violeta", value: "#8B5CF6" },
  { name: "Verde", value: "#10B981" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Rojo", value: "#EF4444" },
  { name: "Amarillo", value: "#F59E0B" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Naranja", value: "#F97316" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Esmeralda", value: "#34D399" },
  { name: "Fucsia", value: "#D946EF" },
  { name: "Gris", value: "#6B7280" },
];

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  isLoading: false,
  error: null,
  isModalOpen: false,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;

      set({ categories: data || [], isLoading: false });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCategory: async (name, color) => {
    set({ isLoading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: name.trim(),
          color,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        categories: [...state.categories, data].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        isLoading: false,
      }));

      return data;
    } catch (error) {
      console.error("Error adding category:", error);
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  updateCategory: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        categories: state.categories
          .map((c) => (c.id === id ? { ...c, ...data } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error updating category:", error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error deleting category:", error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
