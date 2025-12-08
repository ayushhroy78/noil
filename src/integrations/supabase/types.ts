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
      achievements: {
        Row: {
          badge_tier: string
          created_at: string
          description: string
          icon: string | null
          id: string
          milestone_type: string
          milestone_value: number
          points_reward: number
          title: string
        }
        Insert: {
          badge_tier: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          milestone_type: string
          milestone_value: number
          points_reward?: number
          title: string
        }
        Update: {
          badge_tier?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          milestone_type?: string
          milestone_value?: number
          points_reward?: number
          title?: string
        }
        Relationships: []
      }
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
      challenge_check_ins: {
        Row: {
          alternative_ingredients: string[] | null
          check_in_date: string
          cooking_method: string | null
          cooking_notes: string | null
          cravings_notes: string | null
          created_at: string
          energy_level: number | null
          entry_timestamp: string
          flag_reason: string | null
          flagged_suspicious: boolean | null
          id: string
          ingredients_used: string[] | null
          is_verified: boolean | null
          meal_type: string
          mood: string | null
          oil_quantity_ml: number | null
          oil_type: string | null
          photo_exif_date: string | null
          photo_uploaded_at: string | null
          photo_url: string | null
          user_challenge_id: string
          user_id: string
          verification_score: number | null
        }
        Insert: {
          alternative_ingredients?: string[] | null
          check_in_date?: string
          cooking_method?: string | null
          cooking_notes?: string | null
          cravings_notes?: string | null
          created_at?: string
          energy_level?: number | null
          entry_timestamp?: string
          flag_reason?: string | null
          flagged_suspicious?: boolean | null
          id?: string
          ingredients_used?: string[] | null
          is_verified?: boolean | null
          meal_type: string
          mood?: string | null
          oil_quantity_ml?: number | null
          oil_type?: string | null
          photo_exif_date?: string | null
          photo_uploaded_at?: string | null
          photo_url?: string | null
          user_challenge_id: string
          user_id: string
          verification_score?: number | null
        }
        Update: {
          alternative_ingredients?: string[] | null
          check_in_date?: string
          cooking_method?: string | null
          cooking_notes?: string | null
          cravings_notes?: string | null
          created_at?: string
          energy_level?: number | null
          entry_timestamp?: string
          flag_reason?: string | null
          flagged_suspicious?: boolean | null
          id?: string
          ingredients_used?: string[] | null
          is_verified?: boolean | null
          meal_type?: string
          mood?: string | null
          oil_quantity_ml?: number | null
          oil_type?: string | null
          photo_exif_date?: string | null
          photo_uploaded_at?: string | null
          photo_url?: string | null
          user_challenge_id?: string
          user_id?: string
          verification_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_check_ins_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_daily_prompts: {
        Row: {
          created_at: string
          expected_detail: string | null
          id: string
          prompt_date: string
          prompt_text: string
          response_verified: boolean | null
          user_challenge_id: string
          user_id: string
          user_response: string | null
        }
        Insert: {
          created_at?: string
          expected_detail?: string | null
          id?: string
          prompt_date?: string
          prompt_text: string
          response_verified?: boolean | null
          user_challenge_id: string
          user_id: string
          user_response?: string | null
        }
        Update: {
          created_at?: string
          expected_detail?: string | null
          id?: string
          prompt_date?: string
          prompt_text?: string
          response_verified?: boolean | null
          user_challenge_id?: string
          user_id?: string
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_daily_prompts_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_streaks: {
        Row: {
          best_streak: number | null
          created_at: string
          current_streak: number | null
          id: string
          last_check_in_date: string | null
          missed_days: number | null
          streak_start_date: string | null
          total_check_ins: number | null
          updated_at: string
          user_challenge_id: string
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_check_in_date?: string | null
          missed_days?: number | null
          streak_start_date?: string | null
          total_check_ins?: number | null
          updated_at?: string
          user_challenge_id: string
          user_id: string
        }
        Update: {
          best_streak?: number | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_check_in_date?: string | null
          missed_days?: number | null
          streak_start_date?: string | null
          total_check_ins?: number | null
          updated_at?: string
          user_challenge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_streaks_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          duration_days: number
          id: string
          reward_points: number | null
          target_metric: string | null
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          duration_days: number
          id?: string
          reward_points?: number | null
          target_metric?: string | null
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          reward_points?: number | null
          target_metric?: string | null
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          is_deleted: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          is_deleted: boolean
          is_hidden: boolean
          post_type: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_hidden?: boolean
          post_type: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_hidden?: boolean
          post_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          followers_count: number
          following_count: number
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          followers_count?: number
          following_count?: number
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          followers_count?: number
          following_count?: number
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      community_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reported_by: string
          status: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reported_by: string
          status?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reported_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      consumption_audits: {
        Row: {
          audit_date: string
          consumption_trend: string
          created_at: string
          daily_consumption: number | null
          health_indicators: Json
          health_score: number | null
          id: string
          insights: Json
          monthly_consumption: number | null
          overall_risk: string
          recommendations: Json
          risk_score: number
          user_id: string
          weekly_analysis: string | null
          weekly_consumption: number | null
        }
        Insert: {
          audit_date?: string
          consumption_trend: string
          created_at?: string
          daily_consumption?: number | null
          health_indicators?: Json
          health_score?: number | null
          id?: string
          insights?: Json
          monthly_consumption?: number | null
          overall_risk: string
          recommendations?: Json
          risk_score: number
          user_id: string
          weekly_analysis?: string | null
          weekly_consumption?: number | null
        }
        Update: {
          audit_date?: string
          consumption_trend?: string
          created_at?: string
          daily_consumption?: number | null
          health_indicators?: Json
          health_score?: number | null
          id?: string
          insights?: Json
          monthly_consumption?: number | null
          overall_risk?: string
          recommendations?: Json
          risk_score?: number
          user_id?: string
          weekly_analysis?: string | null
          weekly_consumption?: number | null
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          amount_ml: number
          created_at: string | null
          id: string
          log_date: string
          notes: string | null
          oil_type: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          oil_type?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          oil_type?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      direct_message_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_one: string
          participant_two: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one: string
          participant_two: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one?: string
          participant_two?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "direct_message_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string
          daily_oil_goal_ml: number | null
          gender: string | null
          height_cm: number | null
          id: string
          name: string
          relationship: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          daily_oil_goal_ml?: number | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          name: string
          relationship?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          daily_oil_goal_ml?: number | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          name?: string
          relationship?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
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
      habit_integrity: {
        Row: {
          created_at: string
          feature_vector: Json | null
          flags: Json | null
          habit_stability_score: number
          honesty_level: string
          id: string
          last_computed_at: string
          reward_multiplier: number
          signals: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_vector?: Json | null
          flags?: Json | null
          habit_stability_score?: number
          honesty_level?: string
          id?: string
          last_computed_at?: string
          reward_multiplier?: number
          signals?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_vector?: Json | null
          flags?: Json | null
          habit_stability_score?: number
          honesty_level?: string
          id?: string
          last_computed_at?: string
          reward_multiplier?: number
          signals?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_content: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          preview: string
          tags: string[] | null
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          preview: string
          tags?: string[] | null
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          preview?: string
          tags?: string[] | null
          title?: string
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
      milestones: {
        Row: {
          code: string
          created_at: string
          description: string
          icon: string | null
          id: string
          points_reward: number | null
          threshold_value: number | null
          title: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          points_reward?: number | null
          threshold_value?: number | null
          title: string
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          points_reward?: number | null
          threshold_value?: number | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      nudge_templates: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          priority: number | null
          template_text: string
          trigger_type: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          priority?: number | null
          template_text: string
          trigger_type: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          priority?: number | null
          template_text?: string
          trigger_type?: string
        }
        Relationships: []
      }
      oil_reduction_goals: {
        Row: {
          created_at: string
          current_annual_oil_kg: number
          family_size: number
          id: string
          is_active: boolean
          name: string
          oil_price_per_liter: number
          target_reduction_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_annual_oil_kg: number
          family_size?: number
          id?: string
          is_active?: boolean
          name?: string
          oil_price_per_liter?: number
          target_reduction_percent: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_annual_oil_kg?: number
          family_size?: number
          id?: string
          is_active?: boolean
          name?: string
          oil_price_per_liter?: number
          target_reduction_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      point_transactions: {
        Row: {
          balance_after: number
          created_at: string
          description: string
          id: string
          points: number
          source: string
          source_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          description: string
          id?: string
          points: number
          source: string
          source_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          description?: string
          id?: string
          points?: number
          source?: string
          source_id?: string | null
          transaction_type?: string
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
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          created_at: string
          id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          created_at?: string
          id?: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          created_at: string
          explanation: string | null
          id: string
          options: Json
          order_num: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          correct_answer: number
          created_at?: string
          explanation?: string | null
          id?: string
          options: Json
          order_num: number
          question_text: string
          quiz_id: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          order_num?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          reward_points: number | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          reward_points?: number | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          reward_points?: number | null
          title?: string
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
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_rewarded: boolean | null
          referrer_id: string
          referrer_rewarded: boolean | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_rewarded?: boolean | null
          referrer_id: string
          referrer_rewarded?: boolean | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_rewarded?: boolean | null
          referrer_id?: string
          referrer_rewarded?: boolean | null
          status?: string
        }
        Relationships: []
      }
      restaurant_applications: {
        Row: {
          address: string
          admin_notes: string | null
          approved_at: string | null
          blockchain_certified: boolean | null
          blockchain_certified_at: string | null
          blockchain_hash: string | null
          blockchain_network: string | null
          blockchain_tx_hash: string | null
          certifications: string[] | null
          city: string
          cooking_methods: string[] | null
          created_at: string
          cuisines: string[] | null
          daily_customers: string | null
          description: string | null
          email: string
          food_photos: Json | null
          id: string
          logo_url: string | null
          menu_items: Json | null
          oil_types: string[] | null
          owner_name: string
          phone: string
          rejected_at: string | null
          restaurant_name: string
          state: string
          status: string
          updated_at: string
          user_id: string
          years_in_business: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          approved_at?: string | null
          blockchain_certified?: boolean | null
          blockchain_certified_at?: string | null
          blockchain_hash?: string | null
          blockchain_network?: string | null
          blockchain_tx_hash?: string | null
          certifications?: string[] | null
          city: string
          cooking_methods?: string[] | null
          created_at?: string
          cuisines?: string[] | null
          daily_customers?: string | null
          description?: string | null
          email: string
          food_photos?: Json | null
          id?: string
          logo_url?: string | null
          menu_items?: Json | null
          oil_types?: string[] | null
          owner_name: string
          phone: string
          rejected_at?: string | null
          restaurant_name: string
          state: string
          status?: string
          updated_at?: string
          user_id: string
          years_in_business?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          approved_at?: string | null
          blockchain_certified?: boolean | null
          blockchain_certified_at?: string | null
          blockchain_hash?: string | null
          blockchain_network?: string | null
          blockchain_tx_hash?: string | null
          certifications?: string[] | null
          city?: string
          cooking_methods?: string[] | null
          created_at?: string
          cuisines?: string[] | null
          daily_customers?: string | null
          description?: string | null
          email?: string
          food_photos?: Json | null
          id?: string
          logo_url?: string | null
          menu_items?: Json | null
          oil_types?: string[] | null
          owner_name?: string
          phone?: string
          rejected_at?: string | null
          restaurant_name?: string
          state?: string
          status?: string
          updated_at?: string
          user_id?: string
          years_in_business?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          points_cost: number
          reward_type: string
          reward_value: string
          stock_quantity: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          points_cost: number
          reward_type: string
          reward_value: string
          stock_quantity?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          points_cost?: number
          reward_type?: string
          reward_value?: string
          stock_quantity?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          id: string
          progress_data: Json | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_data?: Json | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_data?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          achieved_at: string
          created_at: string
          id: string
          is_shared: boolean | null
          meta: Json | null
          milestone_id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          id?: string
          is_shared?: boolean | null
          meta?: Json | null
          milestone_id: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          created_at?: string
          id?: string
          is_shared?: boolean | null
          meta?: Json | null
          milestone_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          lifetime_points_earned: number
          lifetime_points_spent: number
          points_this_month: number
          points_this_week: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_points_earned?: number
          lifetime_points_spent?: number
          points_this_month?: number
          points_this_week?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_points_earned?: number
          lifetime_points_spent?: number
          points_this_month?: number
          points_this_week?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          city: string | null
          created_at: string
          full_name: string | null
          gender: string | null
          health_conditions: string[] | null
          height_cm: number | null
          household_size: number | null
          id: string
          referral_code: string | null
          referred_by: string | null
          region: string | null
          state: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          health_conditions?: string[] | null
          height_cm?: number | null
          household_size?: number | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          region?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          health_conditions?: string[] | null
          height_cm?: number | null
          household_size?: number | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          region?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          expires_at: string | null
          id: string
          is_used: boolean | null
          redeemed_at: string
          redemption_code: string | null
          reward_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          redeemed_at?: string
          redemption_code?: string | null
          reward_id: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          redeemed_at?: string
          redemption_code?: string | null
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      get_anonymized_leaderboard: {
        Args: never
        Returns: {
          display_name: string
          points_this_month: number
          points_this_week: number
          rank: number
          total_points: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "policymaker"
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
      app_role: ["admin", "moderator", "user", "policymaker"],
    },
  },
} as const
