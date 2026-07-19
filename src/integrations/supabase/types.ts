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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          attachment_path: string | null
          body: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          attachment_path?: string | null
          body: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
        }
        Update: {
          attachment_path?: string | null
          body?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "custom_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          created_at: string
          id: string
          is_suspended: boolean
          portfolio_url: string | null
          reliability_score: number
          suspended_reason: string | null
          tagline: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_suspended?: boolean
          portfolio_url?: string | null
          reliability_score?: number
          suspended_reason?: string | null
          tagline?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_suspended?: boolean
          portfolio_url?: string | null
          reliability_score?: number
          suspended_reason?: string | null
          tagline?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_requests: {
        Row: {
          brief: string
          budget_cents: number
          buyer_id: string
          created_at: string
          deadline: string | null
          id: string
          model_preference: string | null
          reference_image_path: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          usage_rights: Database["public"]["Enums"]["usage_rights"]
        }
        Insert: {
          brief?: string
          budget_cents?: number
          buyer_id: string
          created_at?: string
          deadline?: string | null
          id?: string
          model_preference?: string | null
          reference_image_path?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          usage_rights?: Database["public"]["Enums"]["usage_rights"]
        }
        Update: {
          brief?: string
          budget_cents?: number
          buyer_id?: string
          created_at?: string
          deadline?: string | null
          id?: string
          model_preference?: string | null
          reference_image_path?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          usage_rights?: Database["public"]["Enums"]["usage_rights"]
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          full_prompt: string
          id: string
          negative_prompt: string
          offer_id: string
          preview_image_path: string | null
          settings: Json
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_prompt?: string
          id?: string
          negative_prompt?: string
          offer_id: string
          preview_image_path?: string | null
          settings?: Json
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_prompt?: string
          id?: string
          negative_prompt?: string
          offer_id?: string
          preview_image_path?: string | null
          settings?: Json
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          email_type: string
          error: string | null
          id: string
          provider_id: string | null
          purchase_id: string
          recipient_email: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error?: string | null
          id?: string
          provider_id?: string | null
          purchase_id: string
          recipient_email: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error?: string | null
          id?: string
          provider_id?: string | null
          purchase_id?: string
          recipient_email?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          listing_id: string
          sort_order: number
          source: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id: string
          sort_order?: number
          source?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id?: string
          sort_order?: number
          source?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          aspect_ratio: string
          avg_rating: number
          consistency_score: number
          created_at: string
          creator_id: string
          description: string
          id: string
          image_type: string
          model: string
          model_version: string
          partial_prompt_preview: string
          price_cents: number
          rating_count: number
          sales_count: number
          status: Database["public"]["Enums"]["listing_status"]
          style_tags: string[]
          title: string
          updated_at: string
          usage_rights: Database["public"]["Enums"]["usage_rights"]
        }
        Insert: {
          aspect_ratio?: string
          avg_rating?: number
          consistency_score?: number
          created_at?: string
          creator_id: string
          description?: string
          id?: string
          image_type?: string
          model: string
          model_version?: string
          partial_prompt_preview?: string
          price_cents?: number
          rating_count?: number
          sales_count?: number
          status?: Database["public"]["Enums"]["listing_status"]
          style_tags?: string[]
          title: string
          updated_at?: string
          usage_rights?: Database["public"]["Enums"]["usage_rights"]
        }
        Update: {
          aspect_ratio?: string
          avg_rating?: number
          consistency_score?: number
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          image_type?: string
          model?: string
          model_version?: string
          partial_prompt_preview?: string
          price_cents?: number
          rating_count?: number
          sales_count?: number
          status?: Database["public"]["Enums"]["listing_status"]
          style_tags?: string[]
          title?: string
          updated_at?: string
          usage_rights?: Database["public"]["Enums"]["usage_rights"]
        }
        Relationships: []
      }
      logs: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: Database["public"]["Enums"]["log_event_type"]
          id: string
          level: Database["public"]["Enums"]["log_level"]
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: Database["public"]["Enums"]["log_event_type"]
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: Database["public"]["Enums"]["log_event_type"]
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          payload?: Json
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          price_cents: number
          request_id: string
          sample_direction: string
          status: Database["public"]["Enums"]["offer_status"]
          turnaround_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          price_cents: number
          request_id: string
          sample_direction?: string
          status?: Database["public"]["Enums"]["offer_status"]
          turnaround_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          price_cents?: number
          request_id?: string
          sample_direction?: string
          status?: Database["public"]["Enums"]["offer_status"]
          turnaround_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "custom_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      private_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value?: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          payment_reference: string | null
          price_cents: number
          status: Database["public"]["Enums"]["purchase_status"]
          updated_at: string
          usage_rights: Database["public"]["Enums"]["usage_rights"]
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          payment_reference?: string | null
          price_cents: number
          status?: Database["public"]["Enums"]["purchase_status"]
          updated_at?: string
          usage_rights: Database["public"]["Enums"]["usage_rights"]
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          payment_reference?: string | null
          price_cents?: number
          status?: Database["public"]["Enums"]["purchase_status"]
          updated_at?: string
          usage_rights?: Database["public"]["Enums"]["usage_rights"]
        }
        Relationships: [
          {
            foreignKeyName: "purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_secrets: {
        Row: {
          created_at: string
          full_prompt: string
          id: string
          listing_id: string
          negative_prompt: string
          settings: Json
          updated_at: string
          usage_notes: string
        }
        Insert: {
          created_at?: string
          full_prompt?: string
          id?: string
          listing_id: string
          negative_prompt?: string
          settings?: Json
          updated_at?: string
          usage_notes?: string
        }
        Update: {
          created_at?: string
          full_prompt?: string
          id?: string
          listing_id?: string
          negative_prompt?: string
          settings?: Json
          updated_at?: string
          usage_notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_secrets_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          created_at: string
          details: string
          id: string
          listing_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          created_at?: string
          details?: string
          id?: string
          listing_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          created_at?: string
          details?: string
          id?: string
          listing_id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string
          created_at: string
          id: string
          listing_id: string
          purchase_id: string
          rating: number
          test_generation_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          comment?: string
          created_at?: string
          id?: string
          listing_id: string
          purchase_id: string
          rating: number
          test_generation_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          comment?: string
          created_at?: string
          id?: string
          listing_id?: string
          purchase_id?: string
          rating?: number
          test_generation_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: true
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_offer: {
        Args: { _offer_id: string }
        Returns: {
          created_at: string
          creator_id: string
          id: string
          price_cents: number
          request_id: string
          sample_direction: string
          status: Database["public"]["Enums"]["offer_status"]
          turnaround_days: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_dashboard_stats: { Args: never; Returns: Json }
      admin_generate_demo_catalog: { Args: never; Returns: Json }
      admin_remove_listing: {
        Args: { _listing_id: string }
        Returns: undefined
      }
      admin_suspend_creator: {
        Args: { _reason: string; _user_id: string }
        Returns: undefined
      }
      become_creator: {
        Args: {
          _bio: string
          _display_name: string
          _portfolio_url: string
          _tagline: string
        }
        Returns: {
          created_at: string
          id: string
          is_suspended: boolean
          portfolio_url: string | null
          reliability_score: number
          suspended_reason: string | null
          tagline: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "creator_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_listing_if_safe: {
        Args: { _listing_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_request_participant: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      log_event: {
        Args: {
          _entity_id?: string
          _entity_type?: string
          _event_type: Database["public"]["Enums"]["log_event_type"]
          _level?: Database["public"]["Enums"]["log_level"]
          _payload?: Json
        }
        Returns: string
      }
      report_listing: {
        Args: {
          _details?: string
          _listing_id: string
          _reason: Database["public"]["Enums"]["report_reason"]
        }
        Returns: {
          admin_id: string | null
          admin_notes: string | null
          created_at: string
          details: string
          id: string
          listing_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_listing_status: {
        Args: {
          _listing_id: string
          _status: Database["public"]["Enums"]["listing_status"]
        }
        Returns: {
          aspect_ratio: string
          avg_rating: number
          consistency_score: number
          created_at: string
          creator_id: string
          description: string
          id: string
          image_type: string
          model: string
          model_version: string
          partial_prompt_preview: string
          price_cents: number
          rating_count: number
          sales_count: number
          status: Database["public"]["Enums"]["listing_status"]
          style_tags: string[]
          title: string
          updated_at: string
          usage_rights: Database["public"]["Enums"]["usage_rights"]
        }
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      simulate_purchase: {
        Args: { _listing_id: string }
        Returns: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          payment_reference: string | null
          price_cents: number
          status: Database["public"]["Enums"]["purchase_status"]
          updated_at: string
          usage_rights: Database["public"]["Enums"]["usage_rights"]
        }
        SetofOptions: {
          from: "*"
          to: "purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "buyer" | "creator" | "admin"
      delivery_status: "delivered" | "revision_requested" | "approved"
      listing_status: "draft" | "published" | "removed_by_admin" | "suspended"
      log_event_type:
        | "login"
        | "prompt_upload"
        | "purchase"
        | "image_generation"
        | "ai_assistant_request"
        | "voice_usage"
        | "email_sent"
        | "api_failure"
        | "listing_reported"
        | "admin_action"
      log_level: "info" | "warn" | "error"
      offer_status: "submitted" | "accepted" | "declined" | "withdrawn"
      purchase_status: "pending" | "completed" | "failed" | "refunded"
      report_reason:
        | "copyright"
        | "misleading_preview"
        | "inappropriate"
        | "other"
      report_status: "open" | "reviewing" | "actioned" | "dismissed"
      request_status:
        | "open"
        | "awarded"
        | "delivered"
        | "approved"
        | "closed"
        | "cancelled"
      usage_rights: "personal" | "commercial" | "extended"
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
      app_role: ["buyer", "creator", "admin"],
      delivery_status: ["delivered", "revision_requested", "approved"],
      listing_status: ["draft", "published", "removed_by_admin", "suspended"],
      log_event_type: [
        "login",
        "prompt_upload",
        "purchase",
        "image_generation",
        "ai_assistant_request",
        "voice_usage",
        "email_sent",
        "api_failure",
        "listing_reported",
        "admin_action",
      ],
      log_level: ["info", "warn", "error"],
      offer_status: ["submitted", "accepted", "declined", "withdrawn"],
      purchase_status: ["pending", "completed", "failed", "refunded"],
      report_reason: [
        "copyright",
        "misleading_preview",
        "inappropriate",
        "other",
      ],
      report_status: ["open", "reviewing", "actioned", "dismissed"],
      request_status: [
        "open",
        "awarded",
        "delivered",
        "approved",
        "closed",
        "cancelled",
      ],
      usage_rights: ["personal", "commercial", "extended"],
    },
  },
} as const
