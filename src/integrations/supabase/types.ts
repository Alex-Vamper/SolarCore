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
      admin_ander_commands: {
        Row: {
          command_category: string
          command_name: string
          command_text: string
          created_by: string
          created_date: string
          id: string
          is_active: boolean
          last_used: string | null
          response_text: string
          updated_date: string
          usage_count: number
        }
        Insert: {
          command_category?: string
          command_name: string
          command_text: string
          created_by: string
          created_date?: string
          id?: string
          is_active?: boolean
          last_used?: string | null
          response_text: string
          updated_date?: string
          usage_count?: number
        }
        Update: {
          command_category?: string
          command_name?: string
          command_text?: string
          created_by?: string
          created_date?: string
          id?: string
          is_active?: boolean
          last_used?: string | null
          response_text?: string
          updated_date?: string
          usage_count?: number
        }
        Relationships: []
      }
      admin_credentials: {
        Row: {
          admin_name: string
          created_by_name: string
          created_date: string
          id: string
          keycode: string
          uid: string
          updated_date: string
        }
        Insert: {
          admin_name: string
          created_by_name: string
          created_date?: string
          id?: string
          keycode: string
          uid: string
          updated_date?: string
        }
        Update: {
          admin_name?: string
          created_by_name?: string
          created_date?: string
          id?: string
          keycode?: string
          uid?: string
          updated_date?: string
        }
        Relationships: []
      }
      admin_devices: {
        Row: {
          building_name: string | null
          created_by: string
          created_date: string
          device_class: string
          device_id: string
          device_name: string
          device_type: string
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          is_flagged: boolean
          room_name: string | null
          status: string
          updated_date: string
          user_id: string | null
        }
        Insert: {
          building_name?: string | null
          created_by: string
          created_date?: string
          device_class: string
          device_id: string
          device_name: string
          device_type: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_flagged?: boolean
          room_name?: string | null
          status?: string
          updated_date?: string
          user_id?: string | null
        }
        Update: {
          building_name?: string | null
          created_by?: string
          created_date?: string
          device_class?: string
          device_id?: string
          device_name?: string
          device_type?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_flagged?: boolean
          room_name?: string | null
          status?: string
          updated_date?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_flags: {
        Row: {
          created_by: string
          created_date: string
          description: string | null
          flag_type: string
          id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          updated_date: string
        }
        Insert: {
          created_by: string
          created_date?: string
          description?: string | null
          flag_type: string
          id?: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          updated_date?: string
        }
        Update: {
          created_by?: string
          created_date?: string
          description?: string | null
          flag_type?: string
          id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          updated_date?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_by: string
          created_date: string
          delivery_status: string
          id: string
          message: string
          notification_type: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          target_audience: string
          title: string
          updated_date: string
        }
        Insert: {
          created_by: string
          created_date?: string
          delivery_status?: string
          id?: string
          message: string
          notification_type?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          target_audience?: string
          title: string
          updated_date?: string
        }
        Update: {
          created_by?: string
          created_date?: string
          delivery_status?: string
          id?: string
          message?: string
          notification_type?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          target_audience?: string
          title?: string
          updated_date?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_date: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: string
          updated_date: string
          user_id: string
        }
        Insert: {
          created_date?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          role?: string
          updated_date?: string
          user_id: string
        }
        Update: {
          created_date?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_date?: string
          user_id?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_date: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          subscription_plan: string
          updated_date: string
          user_id: string
        }
        Insert: {
          created_date?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          subscription_plan?: string
          updated_date?: string
          user_id: string
        }
        Update: {
          created_date?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          subscription_plan?: string
          updated_date?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_systems: {
        Row: {
          battery_level: number | null
          cost_savings: number | null
          created_at: string | null
          current_usage: number | null
          daily_usage: number | null
          energy_source: string | null
          grid_percentage: number | null
          id: string
          solar_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          battery_level?: number | null
          cost_savings?: number | null
          created_at?: string | null
          current_usage?: number | null
          daily_usage?: number | null
          energy_source?: string | null
          grid_percentage?: number | null
          id?: string
          solar_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          battery_level?: number | null
          cost_savings?: number | null
          created_at?: string | null
          current_usage?: number | null
          daily_usage?: number | null
          energy_source?: string | null
          grid_percentage?: number | null
          id?: string
          solar_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      launch_splash_seen: {
        Row: {
          day_key: string
          id: number
          seen_at: string | null
          user_id: string
        }
        Insert: {
          day_key: string
          id?: number
          seen_at?: string | null
          user_id: string
        }
        Update: {
          day_key?: string
          id?: number
          seen_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      power_systems: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          system_id: string
          system_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          system_id: string
          system_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          system_id?: string
          system_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          onboarded: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          appliances: Json | null
          automation_settings: Json | null
          created_at: string | null
          dome_count: number | null
          id: string
          name: string
          occupancy_status: boolean | null
          order_index: number | null
          pir_sensor_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appliances?: Json | null
          automation_settings?: Json | null
          created_at?: string | null
          dome_count?: number | null
          id?: string
          name: string
          occupancy_status?: boolean | null
          order_index?: number | null
          pir_sensor_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appliances?: Json | null
          automation_settings?: Json | null
          created_at?: string | null
          dome_count?: number | null
          id?: string
          name?: string
          occupancy_status?: boolean | null
          order_index?: number | null
          pir_sensor_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      safety_systems: {
        Row: {
          automation_settings: Json | null
          created_at: string | null
          id: string
          last_triggered: string | null
          room_name: string
          sensor_readings: Json | null
          status: string | null
          system_id: string
          system_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_settings?: Json | null
          created_at?: string | null
          id?: string
          last_triggered?: string | null
          room_name: string
          sensor_readings?: Json | null
          status?: string | null
          system_id: string
          system_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_settings?: Json | null
          created_at?: string | null
          id?: string
          last_triggered?: string | null
          room_name?: string
          sensor_readings?: Json | null
          status?: string | null
          system_id?: string
          system_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          address: string | null
          ander_button_position: Json | null
          ander_device_id: string | null
          ander_enabled: boolean | null
          building_name: string | null
          building_type: string | null
          contact_phone: string | null
          created_at: string | null
          emergency_contacts: Json | null
          energy_mode: string | null
          grid_meter_id: string | null
          id: string
          notifications_enabled: boolean | null
          power_source: string | null
          preferred_email: string | null
          preferred_email_enabled: boolean | null
          preferred_whatsapp: string | null
          preferred_whatsapp_enabled: boolean | null
          security_settings: Json | null
          setup_completed: boolean | null
          solar_system_id: string | null
          stripe_customer_id: string | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          total_domes: number | null
          total_rooms: number | null
          updated_at: string | null
          user_id: string
          voice_response_enabled: boolean | null
        }
        Insert: {
          address?: string | null
          ander_button_position?: Json | null
          ander_device_id?: string | null
          ander_enabled?: boolean | null
          building_name?: string | null
          building_type?: string | null
          contact_phone?: string | null
          created_at?: string | null
          emergency_contacts?: Json | null
          energy_mode?: string | null
          grid_meter_id?: string | null
          id?: string
          notifications_enabled?: boolean | null
          power_source?: string | null
          preferred_email?: string | null
          preferred_email_enabled?: boolean | null
          preferred_whatsapp?: string | null
          preferred_whatsapp_enabled?: boolean | null
          security_settings?: Json | null
          setup_completed?: boolean | null
          solar_system_id?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          total_domes?: number | null
          total_rooms?: number | null
          updated_at?: string | null
          user_id: string
          voice_response_enabled?: boolean | null
        }
        Update: {
          address?: string | null
          ander_button_position?: Json | null
          ander_device_id?: string | null
          ander_enabled?: boolean | null
          building_name?: string | null
          building_type?: string | null
          contact_phone?: string | null
          created_at?: string | null
          emergency_contacts?: Json | null
          energy_mode?: string | null
          grid_meter_id?: string | null
          id?: string
          notifications_enabled?: boolean | null
          power_source?: string | null
          preferred_email?: string | null
          preferred_email_enabled?: boolean | null
          preferred_whatsapp?: string | null
          preferred_whatsapp_enabled?: boolean | null
          security_settings?: Json | null
          setup_completed?: boolean | null
          solar_system_id?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          total_domes?: number | null
          total_rooms?: number | null
          updated_at?: string | null
          user_id?: string
          voice_response_enabled?: boolean | null
        }
        Relationships: []
      }
      voice_commands: {
        Row: {
          action_type: string | null
          audio_url: string | null
          command_category: string
          command_name: string
          created_at: string
          enabled: boolean
          id: string
          is_global: boolean | null
          keywords: string[]
          response: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type?: string | null
          audio_url?: string | null
          command_category: string
          command_name: string
          created_at?: string
          enabled?: boolean
          id?: string
          is_global?: boolean | null
          keywords?: string[]
          response: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string | null
          audio_url?: string | null
          command_category?: string
          command_name?: string
          created_at?: string
          enabled?: boolean
          id?: string
          is_global?: boolean | null
          keywords?: string[]
          response?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_response_audios: {
        Row: {
          command_id: string | null
          created_at: string
          duration_seconds: number | null
          format: string
          id: string
          provider: string
          storage_path: string
          transcript: string | null
          updated_at: string
          user_id: string
          voice_id: string | null
        }
        Insert: {
          command_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          format?: string
          id?: string
          provider?: string
          storage_path: string
          transcript?: string | null
          updated_at?: string
          user_id: string
          voice_id?: string | null
        }
        Update: {
          command_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          format?: string
          id?: string
          provider?: string
          storage_path?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_voice_response_audios_command_id"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "voice_commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_response_audios_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "voice_commands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_superadmin: {
        Args: { user_email: string }
        Returns: boolean
      }
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
