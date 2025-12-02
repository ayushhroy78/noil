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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      barcode_scans: {
        Row: {
          barcode: string | null
          created_at: string | null
          fat_content_g: number | null
          id: string
          oil_content_ml: number
          product_name: string
          scan_date: string
          trans_fat_g: number | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          created_at?: string | null
          fat_content_g?: number | null
          id?: string
          oil_content_ml: number
          product_name: string
          scan_date?: string
          trans_fat_g?: number | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          created_at?: string | null
          fat_content_g?: number | null
          id?: string
          oil_content_ml?: number
          product_name?: string
          scan_date?: string
          trans_fat_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      bottles: {
        Row: {
          avg_daily_consumption: number | null
          brand: string
          created_at: string | null
          days_used: number | null
          finish_date: string | null
          id: string
          oil_type: string
          quantity_ml: number
          start_date: string
          user_id: string
        }
        Insert: {
          avg_daily_consumption?: number | null
          brand: string
          created_at?: string | null
          days_used?: number | null
          finish_date?: string | null
          id?: string
          oil_type: string
          quantity_ml: number
          start_date?: string
          user_id: string
        }
        Update: {
          avg_daily_consumption?: number | null
          brand?: string
          created_at?: string | null
          days_used?: number | null
          finish_date?: string | null
          id?: string
          oil_type?: string
          quantity_ml?: number
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          amount_ml: number
          created_at: string | null
          id: string
          log_date: string
          notes: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_recipe_logs: {
        Row: {
          created_at: string
          cuisine_preference: string | null
          id: string
          ingredients_input: string
          meal_type: string | null
          oil_estimate_ml: number
          recipe_output: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          cuisine_preference?: string | null
          id?: string
          ingredients_input: string
          meal_type?: string | null
          oil_estimate_ml: number
          recipe_output: Json
          user_id: string
        }
        Update: {
          created_at?: string
          cuisine_preference?: string | null
          id?: string
          ingredients_input?: string
          meal_type?: string | null
          oil_estimate_ml?: number
          recipe_output?: Json
          user_id?: string
        }
        Relationships: []
      }
      health_scores: {
        Row: {
          bottle_oil: number | null
          cooking_oil: number | null
          created_at: string | null
          frequency_score: number | null
          hidden_oil: number | null
          hidden_oil_percentage: number | null
          id: string
          oil_quality_score: number | null
          score: number
          score_date: string
          total_oil_consumed: number
          user_id: string
        }
        Insert: {
          bottle_oil?: number | null
          cooking_oil?: number | null
          created_at?: string | null
          frequency_score?: number | null
          hidden_oil?: number | null
          hidden_oil_percentage?: number | null
          id?: string
          oil_quality_score?: number | null
          score: number
          score_date?: string
          total_oil_consumed: number
          user_id: string
        }
        Update: {
          bottle_oil?: number | null
          cooking_oil?: number | null
          created_at?: string | null
          frequency_score?: number | null
          hidden_oil?: number | null
          hidden_oil_percentage?: number | null
          id?: string
          oil_quality_score?: number | null
          score?: number
          score_date?: string
          total_oil_consumed?: number
          user_id?: string
        }
        Relationships: []
      }
      iot_devices: {
        Row: {
          created_at: string
          device_id: string
          device_name: string | null
          id: string
          is_active: boolean | null
          linked_bottle_id: string | null
          linked_oil_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          linked_bottle_id?: string | null
          linked_oil_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          linked_bottle_id?: string | null
          linked_oil_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "iot_devices_linked_bottle_id_fkey"
            columns: ["linked_bottle_id"]
            isOneToOne: false
            referencedRelation: "bottles"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_usage_logs: {
        Row: {
          created_at: string
          device_id: string
          id: string
          logged_at: string
          synced_to_tracking: boolean | null
          user_id: string
          volume_used_ml: number
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          logged_at?: string
          synced_to_tracking?: boolean | null
          user_id: string
          volume_used_ml: number
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          logged_at?: string
          synced_to_tracking?: boolean | null
          user_id?: string
          volume_used_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "iot_usage_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "iot_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string
          quantity?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: string | null
          delivery_charges: number | null
          id: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          delivery_charges?: number | null
          id?: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          delivery_charges?: number | null
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          price: number
          product_id: string
          stock_quantity: number | null
          variant_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          product_id: string
          stock_quantity?: number | null
          variant_name: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          stock_quantity?: number | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          health_tags: string[] | null
          id: string
          image_url: string | null
          name: string
          oil_type: string | null
          product_type: string
          region_tags: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          health_tags?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          oil_type?: string | null
          product_type: string
          region_tags?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          health_tags?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          oil_type?: string | null
          product_type?: string
          region_tags?: string[] | null
        }
        Relationships: []
      }
      recipes_prebuilt: {
        Row: {
          calories: number | null
          created_at: string
          cuisine: string
          id: string
          ingredients: Json
          meal_type: string
          name: string
          oil_estimate_ml: number
          prep_time_minutes: number | null
          steps: Json
          tags: string[]
        }
        Insert: {
          calories?: number | null
          created_at?: string
          cuisine: string
          id?: string
          ingredients: Json
          meal_type: string
          name: string
          oil_estimate_ml: number
          prep_time_minutes?: number | null
          steps: Json
          tags?: string[]
        }
        Update: {
          calories?: number | null
          created_at?: string
          cuisine?: string
          id?: string
          ingredients?: Json
          meal_type?: string
          name?: string
          oil_estimate_ml?: number
          prep_time_minutes?: number | null
          steps?: Json
          tags?: string[]
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          region: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          region?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          region?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
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
