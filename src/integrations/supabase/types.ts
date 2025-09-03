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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          research_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          research_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          research_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "researches"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          address: string | null
          answers: Json
          app_version: string | null
          completed_at: string | null
          created_at: string | null
          demographic_data: Json
          device_info: Json | null
          duration_minutes: number | null
          gps_coordinates: Json | null
          id: string
          is_synced: boolean | null
          is_valid: boolean | null
          location_verified: boolean | null
          quality_score: number | null
          region_id: string | null
          research_id: string
          researcher_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["interview_status"] | null
          updated_at: string | null
          validation_notes: string | null
        }
        Insert: {
          address?: string | null
          answers?: Json
          app_version?: string | null
          completed_at?: string | null
          created_at?: string | null
          demographic_data?: Json
          device_info?: Json | null
          duration_minutes?: number | null
          gps_coordinates?: Json | null
          id?: string
          is_synced?: boolean | null
          is_valid?: boolean | null
          location_verified?: boolean | null
          quality_score?: number | null
          region_id?: string | null
          research_id: string
          researcher_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["interview_status"] | null
          updated_at?: string | null
          validation_notes?: string | null
        }
        Update: {
          address?: string | null
          answers?: Json
          app_version?: string | null
          completed_at?: string | null
          created_at?: string | null
          demographic_data?: Json
          device_info?: Json | null
          duration_minutes?: number | null
          gps_coordinates?: Json | null
          id?: string
          is_synced?: boolean | null
          is_valid?: boolean | null
          location_verified?: boolean | null
          quality_score?: number | null
          region_id?: string | null
          research_id?: string
          researcher_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["interview_status"] | null
          updated_at?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "research_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "researches"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_email_sent: boolean | null
          is_push_sent: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: number | null
          read_at: string | null
          research_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_email_sent?: boolean | null
          is_push_sent?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: number | null
          read_at?: string | null
          research_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_email_sent?: boolean | null
          is_push_sent?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: number | null
          read_at?: string | null
          research_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "researches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          created_at: string | null
          document_number: string | null
          efficiency_score: number | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_activity: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          total_interviews_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          document_number?: string | null
          efficiency_score?: number | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          total_interviews_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          document_number?: string | null
          efficiency_score?: number | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          total_interviews_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          access_token: string | null
          charts: Json | null
          csv_url: string | null
          data: Json
          description: string | null
          excel_url: string | null
          filters: Json | null
          generated_at: string | null
          generated_by: string | null
          id: string
          is_public: boolean | null
          pdf_url: string | null
          research_id: string
          title: string
          type: string
        }
        Insert: {
          access_token?: string | null
          charts?: Json | null
          csv_url?: string | null
          data?: Json
          description?: string | null
          excel_url?: string | null
          filters?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_public?: boolean | null
          pdf_url?: string | null
          research_id: string
          title: string
          type: string
        }
        Update: {
          access_token?: string | null
          charts?: Json | null
          csv_url?: string | null
          data?: Json
          description?: string | null
          excel_url?: string | null
          filters?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_public?: boolean | null
          pdf_url?: string | null
          research_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "researches"
            referencedColumns: ["id"]
          },
        ]
      }
      research_regions: {
        Row: {
          boundaries: Json | null
          completed_interviews: number | null
          coordinates: Json | null
          created_at: string | null
          demographic_targets: Json | null
          difficulty: number | null
          id: string
          name: string
          priority: number | null
          research_id: string
          status: Database["public"]["Enums"]["region_status"] | null
          target_interviews: number
          updated_at: string | null
        }
        Insert: {
          boundaries?: Json | null
          completed_interviews?: number | null
          coordinates?: Json | null
          created_at?: string | null
          demographic_targets?: Json | null
          difficulty?: number | null
          id?: string
          name: string
          priority?: number | null
          research_id: string
          status?: Database["public"]["Enums"]["region_status"] | null
          target_interviews: number
          updated_at?: string | null
        }
        Update: {
          boundaries?: Json | null
          completed_interviews?: number | null
          coordinates?: Json | null
          created_at?: string | null
          demographic_targets?: Json | null
          difficulty?: number | null
          id?: string
          name?: string
          priority?: number | null
          research_id?: string
          status?: Database["public"]["Enums"]["region_status"] | null
          target_interviews?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_regions_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "researches"
            referencedColumns: ["id"]
          },
        ]
      }
      research_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_active: boolean | null
          name: string
          questions: Json
          target_audience: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          questions?: Json
          target_audience?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          questions?: Json
          target_audience?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      researcher_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          completed_interviews: number | null
          confidence_score: number | null
          estimated_completion: string | null
          id: string
          is_active: boolean | null
          region_id: string
          research_id: string
          researcher_id: string
          target_interviews: number
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          completed_interviews?: number | null
          confidence_score?: number | null
          estimated_completion?: string | null
          id?: string
          is_active?: boolean | null
          region_id: string
          research_id: string
          researcher_id: string
          target_interviews: number
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          completed_interviews?: number | null
          confidence_score?: number | null
          estimated_completion?: string | null
          id?: string
          is_active?: boolean | null
          region_id?: string
          research_id?: string
          researcher_id?: string
          target_interviews?: number
        }
        Relationships: [
          {
            foreignKeyName: "researcher_assignments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "research_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "researcher_assignments_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "researches"
            referencedColumns: ["id"]
          },
        ]
      }
      researches: {
        Row: {
          allow_offline: boolean | null
          calculated_sample_size: number | null
          city: string
          confidence_level: number
          country: string | null
          created_at: string | null
          created_by: string
          deadline: string | null
          description: string | null
          end_date: string | null
          expected_proportion: number | null
          id: string
          margin_error: number
          name: string
          population: number | null
          questions: Json
          randomize_options: boolean | null
          regions: Json | null
          require_gps: boolean | null
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["research_status"] | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          allow_offline?: boolean | null
          calculated_sample_size?: number | null
          city: string
          confidence_level: number
          country?: string | null
          created_at?: string | null
          created_by: string
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          expected_proportion?: number | null
          id?: string
          margin_error: number
          name: string
          population?: number | null
          questions?: Json
          randomize_options?: boolean | null
          regions?: Json | null
          require_gps?: boolean | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["research_status"] | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_offline?: boolean | null
          calculated_sample_size?: number | null
          city?: string
          confidence_level?: number
          country?: string | null
          created_at?: string | null
          created_by?: string
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          expected_proportion?: number | null
          id?: string
          margin_error?: number
          name?: string
          population?: number | null
          questions?: Json
          randomize_options?: boolean | null
          regions?: Json | null
          require_gps?: boolean | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["research_status"] | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "researches_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "research_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_sample_size: {
        Args: {
          confidence_level: number
          margin_error: number
          population: number
          proportion?: number
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      interview_status: "pending" | "in_progress" | "completed" | "failed"
      question_type: "radio" | "textarea" | "select" | "demographic" | "scale"
      region_status: "pending" | "active" | "completed"
      research_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      user_role: "admin" | "researcher"
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
    Enums: {
      interview_status: ["pending", "in_progress", "completed", "failed"],
      question_type: ["radio", "textarea", "select", "demographic", "scale"],
      region_status: ["pending", "active", "completed"],
      research_status: ["draft", "active", "paused", "completed", "cancelled"],
      user_role: ["admin", "researcher"],
    },
  },
} as const
