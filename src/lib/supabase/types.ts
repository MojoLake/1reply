// Database types for Supabase
// These match the schema defined in supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_scenarios: {
        Row: {
          id: string;
          author_id: string;
          share_code: string;
          title: string;
          difficulty: string;
          situation_a: Json;
          situation_b: Json;
          situation_c: Json | null;
          play_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          share_code: string;
          title: string;
          difficulty: string;
          situation_a: Json;
          situation_b: Json;
          situation_c?: Json | null;
          play_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          share_code?: string;
          title?: string;
          difficulty?: string;
          situation_a?: Json;
          situation_b?: Json;
          situation_c?: Json | null;
          play_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_scenarios_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_scores: {
        Row: {
          id: string;
          user_id: string;
          mode: string;
          score: number;
          rounds_survived: number;
          scenario_id: string | null;
          played_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: string;
          score: number;
          rounds_survived: number;
          scenario_id?: string | null;
          played_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: string;
          score?: number;
          rounds_survived?: number;
          scenario_id?: string | null;
          played_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_scores_scenario_id_fkey";
            columns: ["scenario_id"];
            isOneToOne: false;
            referencedRelation: "user_scenarios";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_play_count: {
        Args: { scenario_share_code: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Helper types for easier use
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserScenario = Database["public"]["Tables"]["user_scenarios"]["Row"];
export type UserScore = Database["public"]["Tables"]["user_scores"]["Row"];
