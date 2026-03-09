export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          wallet_address: string;
          username: string | null;
          avatar_url: string | null;
          current_streak: number;
          best_streak: number;
          total_earned: number;
          total_verified_submissions: number;
          last_submission_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          username?: string | null;
          avatar_url?: string | null;
          current_streak?: number;
          best_streak?: number;
          total_earned?: number;
          total_verified_submissions?: number;
          last_submission_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          username?: string | null;
          avatar_url?: string | null;
          current_streak?: number;
          best_streak?: number;
          total_earned?: number;
          total_verified_submissions?: number;
          last_submission_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          profile_id: string;
          stake_amount: number;
          stake_tx_hash: string;
          status: "active" | "pending_verification" | "completed" | "failed" | "expired";
          started_at: string;
          expires_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          stake_amount: number;
          stake_tx_hash: string;
          status?: "active" | "pending_verification" | "completed" | "failed" | "expired";
          started_at?: string;
          expires_at: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          stake_amount?: number;
          stake_tx_hash?: string;
          status?: "active" | "pending_verification" | "completed" | "failed" | "expired";
          started_at?: string;
          expires_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          session_id: string;
          profile_id: string;
          image_path: string;
          image_sha256: string;
          image_phash: string | null;
          captured_at: string;
          submitted_at: string;
          location: unknown;
          ai_confidence: number | null;
          ai_labels: Json;
          verification_status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          reward_amount: number;
          verifier_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          profile_id: string;
          image_path: string;
          image_sha256: string;
          image_phash?: string | null;
          captured_at: string;
          submitted_at?: string;
          location: unknown;
          ai_confidence?: number | null;
          ai_labels?: Json;
          verification_status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          reward_amount?: number;
          verifier_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          profile_id?: string;
          image_path?: string;
          image_sha256?: string;
          image_phash?: string | null;
          captured_at?: string;
          submitted_at?: string;
          location?: unknown;
          ai_confidence?: number | null;
          ai_labels?: Json;
          verification_status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          reward_amount?: number;
          verifier_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      nfts: {
        Row: {
          id: string;
          profile_id: string;
          milestone_day: 7 | 30 | 100;
          token_id: string | null;
          mint_tx_hash: string | null;
          status: "pending" | "minted" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          milestone_day: 7 | 30 | 100;
          token_id?: string | null;
          mint_tx_hash?: string | null;
          status?: "pending" | "minted" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          milestone_day?: 7 | 30 | 100;
          token_id?: string | null;
          mint_tx_hash?: string | null;
          status?: "pending" | "minted" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          id: string;
          wallet_address: string;
          username: string | null;
          avatar_url: string | null;
          current_streak: number;
          best_streak: number;
          total_earned: number;
          total_verified_submissions: number;
          rank: number;
        };
      };
    };
    Functions: {
      st_geogpoint: {
        Args: { longitude: number; latitude: number };
        Returns: unknown;
      };
    };
    Enums: {
      session_status: "active" | "pending_verification" | "completed" | "failed" | "expired";
      verification_status: "pending" | "approved" | "rejected";
      nft_status: "pending" | "minted" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
