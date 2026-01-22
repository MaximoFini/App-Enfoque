import { supabase } from "../lib/supabase";
import { format } from "date-fns";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CalendarBlock {
  id: string;
  user_id: string;
  title: string;
  type: "deep" | "shallow" | "other";
  category_id?: string | null;
  start_time: string; // TIMESTAMPTZ
  end_time: string; // TIMESTAMPTZ
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarBlockInput {
  title: string;
  type: "deep" | "shallow" | "other";
  category_id?: string | null;
  start_time: string; // ISO string
  end_time: string; // ISO string
  color?: string | null;
}

// =============================================
// CATEGORIES
// =============================================

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  async create(name: string, color: string): Promise<Category> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name, color })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, name: string, color: string): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .update({ name, color })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) throw error;
  },

  /**
   * Get or create a category by name (for Pomodoro integration)
   */
  async getOrCreate(
    name: string,
    color: string = "#3B82F6",
  ): Promise<Category> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // First, try to find existing category
    const { data: existing, error: searchError } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("name", name)
      .maybeSingle();

    if (searchError) throw searchError;

    if (existing) {
      return existing;
    }

    // If not found, create it
    const { data: created, error: createError } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name, color })
      .select()
      .single();

    if (createError) throw createError;
    return created;
  },
};

// =============================================
// CALENDAR BLOCKS
// =============================================

export const calendarBlocksService = {
  /**
   * Get all blocks for a specific week
   */
  async getByWeek(startDate: Date, endDate: Date): Promise<CalendarBlock[]> {
    const startISO = format(startDate, "yyyy-MM-dd'T'00:00:00");
    const endISO = format(endDate, "yyyy-MM-dd'T'23:59:59");

    const { data, error } = await supabase
      .from("calendar_blocks")
      .select("*")
      .gte("start_time", startISO)
      .lte("start_time", endISO)
      .order("start_time");

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all blocks for a specific date
   */
  async getByDate(date: Date): Promise<CalendarBlock[]> {
    const dateStr = format(date, "yyyy-MM-dd");
    const startISO = `${dateStr}T00:00:00`;
    const endISO = `${dateStr}T23:59:59`;

    const { data, error } = await supabase
      .from("calendar_blocks")
      .select("*")
      .gte("start_time", startISO)
      .lte("start_time", endISO)
      .order("start_time");

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new block
   */
  async create(blockInput: CalendarBlockInput): Promise<CalendarBlock> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("calendar_blocks")
      .insert({
        user_id: user.id,
        ...blockInput,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing block
   */
  async update(
    id: string,
    updates: Partial<CalendarBlockInput>,
  ): Promise<CalendarBlock> {
    const { data, error } = await supabase
      .from("calendar_blocks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a block
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("calendar_blocks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Check for overlapping blocks
   */
  async checkOverlap(
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<boolean> {
    let query = supabase
      .from("calendar_blocks")
      .select("id")
      .lt("start_time", endTime)
      .gt("end_time", startTime);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  },
};
