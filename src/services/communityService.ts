import { supabase } from "@/integrations/supabase/client";

export interface Worry {
  id: string;
  device_id: string;
  content: string;
  ai_summary: string | null;
  view_count: number;
  comment_count: number;
  source_type: string;
  use_summary: boolean;
  status: string;
  report_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  worry_id: string;
  device_id: string;
  content: string;
  created_at: string;
}

export interface CreateWorryParams {
  content: string;
  deviceId: string;
  useSummary: boolean;
  sourceType?: string;
}

export const communityService = {
  async getWorries(sourceType?: string): Promise<Worry[]> {
    let query = supabase
      .from("worries")
      .select("*")
      .eq("status", "active");
    
    if (sourceType && sourceType !== "all") {
      query = query.eq("source_type", sourceType);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Worry[];
  },

  async getWorry(id: string): Promise<Worry | null> {
    const { data, error } = await supabase
      .from("worries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data as Worry | null;
  },

  async createWorry(params: CreateWorryParams): Promise<Worry> {
    const { content, deviceId, useSummary, sourceType = "web" } = params;

    // 1. 고민 등록
    const { data: worry, error: insertError } = await supabase
      .from("worries")
      .insert({
        content,
        device_id: deviceId,
        use_summary: useSummary,
        source_type: sourceType,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 2. AI 요약 요청 (use_summary가 true일 때만)
    if (useSummary) {
      supabase.functions.invoke("worry-summarize", {
        body: { worryId: worry.id, content },
      }).catch(console.error);
    }

    return worry as Worry;
  },

  async incrementViewCount(id: string): Promise<void> {
    const { data: current } = await supabase
      .from("worries")
      .select("view_count")
      .eq("id", id)
      .single();
    
    if (current) {
      await supabase
        .from("worries")
        .update({ view_count: ((current.view_count as number) || 0) + 1 })
        .eq("id", id);
    }
  },

  async getComments(worryId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("worry_id", worryId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []) as Comment[];
  },

  async createComment(worryId: string, content: string, deviceId: string): Promise<Comment> {
    const { data, error } = await supabase
      .from("comments")
      .insert({ worry_id: worryId, content, device_id: deviceId })
      .select()
      .single();

    if (error) throw error;
    return data as Comment;
  },
};
