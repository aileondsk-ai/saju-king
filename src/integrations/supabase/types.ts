export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          device_id: string
          id: string
          worry_id: string
        }
        Insert: {
          content: string
          created_at?: string
          device_id: string
          id?: string
          worry_id: string
        }
        Update: {
          content?: string
          created_at?: string
          device_id?: string
          id?: string
          worry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_worry_id_fkey"
            columns: ["worry_id"]
            isOneToOne: false
            referencedRelation: "worries"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_requests: {
        Row: {
          created_at: string
          id: string
          person1_birth_date: string
          person1_birth_time: string | null
          person1_calendar_type: string
          person1_gender: string
          person1_name: string
          person2_birth_date: string
          person2_birth_time: string | null
          person2_calendar_type: string
          person2_gender: string
          person2_name: string
          relation_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          person1_birth_date: string
          person1_birth_time?: string | null
          person1_calendar_type?: string
          person1_gender: string
          person1_name: string
          person2_birth_date: string
          person2_birth_time?: string | null
          person2_calendar_type?: string
          person2_gender: string
          person2_name: string
          relation_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          person1_birth_date?: string
          person1_birth_time?: string | null
          person1_calendar_type?: string
          person1_gender?: string
          person1_name?: string
          person2_birth_date?: string
          person2_birth_time?: string | null
          person2_calendar_type?: string
          person2_gender?: string
          person2_name?: string
          relation_type?: string
        }
        Relationships: []
      }
      premium_saju_orders: {
        Row: {
          amount: number
          birth_date: string
          birth_time: string | null
          calendar_type: string
          contact: string
          created_at: string
          email: string
          face_image_path: string | null
          gender: string
          has_partner: boolean | null
          id: string
          mbti: string | null
          name: string
          order_number: string
          paid_at: string | null
          palm_image_path: string | null
          payment_id: string | null
          payment_status: string
        }
        Insert: {
          amount?: number
          birth_date: string
          birth_time?: string | null
          calendar_type?: string
          contact: string
          created_at?: string
          email: string
          face_image_path?: string | null
          gender: string
          has_partner?: boolean | null
          id?: string
          mbti?: string | null
          name: string
          order_number: string
          paid_at?: string | null
          palm_image_path?: string | null
          payment_id?: string | null
          payment_status?: string
        }
        Update: {
          amount?: number
          birth_date?: string
          birth_time?: string | null
          calendar_type?: string
          contact?: string
          created_at?: string
          email?: string
          face_image_path?: string | null
          gender?: string
          has_partner?: boolean | null
          id?: string
          mbti?: string | null
          name?: string
          order_number?: string
          paid_at?: string | null
          palm_image_path?: string | null
          payment_id?: string | null
          payment_status?: string
        }
        Relationships: []
      }
      premium_saju_results: {
        Row: {
          analysis_content: string
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          id: string
          order_id: string
        }
        Insert: {
          analysis_content: string
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          order_id: string
        }
        Update: {
          analysis_content?: string
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_saju_results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "premium_saju_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          created_at: string
          description: string | null
          function_name: string
          id: string
          is_active: boolean
          prompt_content: string
          prompt_name: string
          updated_at: string
          version_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          function_name: string
          id?: string
          is_active?: boolean
          prompt_content: string
          prompt_name: string
          updated_at?: string
          version_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          function_name?: string
          id?: string
          is_active?: boolean
          prompt_content?: string
          prompt_name?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: []
      }
      saju_requests: {
        Row: {
          birth_date: string
          birth_time: string | null
          calendar_type: string
          created_at: string
          gender: string
          id: string
          name: string
        }
        Insert: {
          birth_date: string
          birth_time?: string | null
          calendar_type?: string
          created_at?: string
          gender: string
          id?: string
          name: string
        }
        Update: {
          birth_date?: string
          birth_time?: string | null
          calendar_type?: string
          created_at?: string
          gender?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      worries: {
        Row: {
          ai_summary: string | null
          comment_count: number
          content: string
          created_at: string
          device_id: string
          id: string
          report_count: number
          source_type: string
          status: string
          updated_at: string
          use_summary: boolean
          view_count: number | null
        }
        Insert: {
          ai_summary?: string | null
          comment_count?: number
          content: string
          created_at?: string
          device_id: string
          id?: string
          report_count?: number
          source_type?: string
          status?: string
          updated_at?: string
          use_summary?: boolean
          view_count?: number | null
        }
        Update: {
          ai_summary?: string | null
          comment_count?: number
          content?: string
          created_at?: string
          device_id?: string
          id?: string
          report_count?: number
          source_type?: string
          status?: string
          updated_at?: string
          use_summary?: boolean
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
