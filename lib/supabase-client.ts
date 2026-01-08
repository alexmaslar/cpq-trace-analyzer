/**
 * Supabase Client Configuration
 * Browser-side client for user-authenticated operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Type definitions for database schema
export interface Database {
  public: {
    Tables: {
      traces: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          raw_content: string;
          parsed_data: Record<string, unknown> | null;
          file_size: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          raw_content: string;
          parsed_data?: Record<string, unknown> | null;
          file_size: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          raw_content?: string;
          parsed_data?: Record<string, unknown> | null;
          file_size?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      baselines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filename: string;
          trace_id: string;
          selection_path: Array<{
            featureName: string;
            selectedValue: string | null;
            optionCount: number;
          }>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          filename: string;
          trace_id: string;
          selection_path: Array<{
            featureName: string;
            selectedValue: string | null;
            optionCount: number;
          }>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          filename?: string;
          trace_id?: string;
          selection_path?: Array<{
            featureName: string;
            selectedValue: string | null;
            optionCount: number;
          }>;
          created_at?: string;
        };
      };
    };
    Views: {
      user_storage_usage: {
        Row: {
          user_id: string;
          trace_count: number;
          total_bytes: number;
          total_mb: number;
        };
      };
    };
  };
}
