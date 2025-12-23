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
      challenges: {
        Row: {
          created_at: string
          description: string
          end_date: string
          id: string
          start_date: string
          target_value: number
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          end_date: string
          id?: string
          start_date: string
          target_value: number
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          start_date?: string
          target_value?: number
          title?: string
          type?: string
        }
        Relationships: []
      }
      community_recipes: {
        Row: {
          average_rating: number | null
          calories: number | null
          carbs: number | null
          created_at: string
          description: string | null
          fat: number | null
          id: string
          image_url: string | null
          ingredients: string[]
          instructions: string[]
          likes_count: number | null
          prep_time: number | null
          protein: number | null
          rating_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          description?: string | null
          fat?: number | null
          id?: string
          image_url?: string | null
          ingredients: string[]
          instructions: string[]
          likes_count?: number | null
          prep_time?: number | null
          protein?: number | null
          rating_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_rating?: number | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          description?: string | null
          fat?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[]
          instructions?: string[]
          likes_count?: number | null
          prep_time?: number | null
          protein?: number | null
          rating_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_macros: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          date: string
          fat: number
          id: string
          protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          fat?: number
          id?: string
          protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          fat?: number
          id?: string
          protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          date: string
          fat: number
          id: string
          meal_type: string | null
          name: string
          portion: string | null
          protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          fat?: number
          id?: string
          meal_type?: string | null
          name: string
          portion?: string | null
          protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          fat?: number
          id?: string
          meal_type?: string | null
          name?: string
          portion?: string | null
          protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_favorites: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          id: string
          name: string
          portion: string | null
          protein: number
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          fat: number
          id?: string
          name: string
          portion?: string | null
          protein: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          name?: string
          portion?: string | null
          protein?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_plan_usage: {
        Row: {
          created_at: string
          generation_count: number
          id: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          generation_count?: number
          id?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          generation_count?: number
          id?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      recipe_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          recipe_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipe_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipe_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_comments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "community_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_likes: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_likes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "community_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          recipe_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          recipe_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "community_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_usage: {
        Row: {
          created_at: string
          id: string
          scan_count: number
          scan_date: string
          updated_at: string
          user_id: string
          week_start: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          scan_count?: number
          scan_date?: string
          updated_at?: string
          user_id: string
          week_start?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          scan_count?: number
          scan_date?: string
          updated_at?: string
          user_id?: string
          week_start?: string | null
        }
        Relationships: []
      }
      subscription_cache: {
        Row: {
          created_at: string
          id: string
          is_trial: boolean | null
          product_id: string | null
          subscribed: boolean
          subscription_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_trial?: boolean | null
          product_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_trial?: boolean | null
          product_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          current_progress: number
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          current_progress?: number
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          current_progress?: number
          id?: string
          joined_at?: string
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
      user_onboarding: {
        Row: {
          community_joined: boolean | null
          created_at: string
          health_sync_choice: string | null
          id: string
          onboarding_complete: boolean
          selected_challenge: string | null
          selected_cooking: string | null
          selected_goal: string | null
          selected_source: string | null
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          community_joined?: boolean | null
          created_at?: string
          health_sync_choice?: string | null
          id?: string
          onboarding_complete?: boolean
          selected_challenge?: string | null
          selected_cooking?: string | null
          selected_goal?: string | null
          selected_source?: string | null
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          community_joined?: boolean | null
          created_at?: string
          health_sync_choice?: string | null
          id?: string
          onboarding_complete?: boolean
          selected_challenge?: string | null
          selected_cooking?: string | null
          selected_goal?: string | null
          selected_source?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tracker_settings: {
        Row: {
          age: number | null
          created_at: string
          daily_calories: number | null
          daily_carbs: number | null
          daily_fat: number | null
          daily_protein: number | null
          goal_mode: string | null
          id: string
          target_weight: number | null
          updated_at: string
          user_id: string
          weekly_goal: number | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_protein?: number | null
          goal_mode?: string | null
          id?: string
          target_weight?: number | null
          updated_at?: string
          user_id: string
          weekly_goal?: number | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_protein?: number | null
          goal_mode?: string | null
          id?: string
          target_weight?: number | null
          updated_at?: string
          user_id?: string
          weekly_goal?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      water_intake: {
        Row: {
          created_at: string
          date: string
          glasses: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          glasses?: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          glasses?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          id: string
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id?: string
          weight?: number
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
