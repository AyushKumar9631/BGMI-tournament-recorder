/**
 * Hand-written types mirroring the SQL schema in
 * /supabase/migrations/0001_init.sql
 *
 * Once the project is linked to a real Supabase project you can replace
 * this file with the output of:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
 * without changing any call sites, since the shape is the same.
 */

export interface Database {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      days: {
        Row: {
          id: string;
          tournament_id: string;
          day_number: number;
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          day_number: number;
          label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          day_number?: number;
          label?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "days_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          }
        ];
      };
      matches: {
        Row: {
          id: string;
          day_id: string;
          match_number: number;
          map_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          match_number: number;
          map_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          day_id?: string;
          match_number?: number;
          map_name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_day_id_fkey";
            columns: ["day_id"];
            isOneToOne: false;
            referencedRelation: "days";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          tournament_id: string;
          name: string;
          tag: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          name: string;
          tag?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          name?: string;
          tag?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          }
        ];
      };
      match_slots: {
        Row: {
          id: string;
          match_id: string;
          slot_number: number;
          team_id: string | null;
          is_locked: boolean;
          position: number | null;
          kills: number;
          // Generated columns — Postgres computes these, never write to them.
          placement_points: number;
          total_points: number;
          wwcd: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          slot_number: number;
          team_id?: string | null;
          is_locked?: boolean;
          position?: number | null;
          kills?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          slot_number?: number;
          team_id?: string | null;
          is_locked?: boolean;
          position?: number | null;
          kills?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_slots_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_slots_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      day_standings: {
        Row: {
          day_id: string;
          tournament_id: string;
          team_id: string;
          team_name: string;
          team_tag: string | null;
          total_points: number;
          total_kills: number;
          wwcd_count: number;
        };
        Relationships: [];
      };
      tournament_standings: {
        Row: {
          tournament_id: string;
          team_id: string;
          team_name: string;
          team_tag: string | null;
          total_points: number;
          total_kills: number;
          wwcd_count: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
