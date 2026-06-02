import { createClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      partners: {
        Row: {
          id: string;
          name: string;
          type: string | null;
          stage: string | null;
          website: string | null;
          appetite: string | null;
          products_to_write: string[] | null;
          claim_process: string | null;
          rating_process: string | null;
          economics: string | null;
          notes: string | null;
          close_checklist: Json[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string | null;
          stage?: string | null;
          website?: string | null;
          appetite?: string | null;
          products_to_write?: string[] | null;
          claim_process?: string | null;
          rating_process?: string | null;
          economics?: string | null;
          notes?: string | null;
          close_checklist?: Json[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string | null;
          stage?: string | null;
          website?: string | null;
          appetite?: string | null;
          products_to_write?: string[] | null;
          claim_process?: string | null;
          rating_process?: string | null;
          economics?: string | null;
          notes?: string | null;
          close_checklist?: Json[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      contacts: {
        Row: { id: string; partner_id: string; name: string; title: string | null; email: string | null; phone: string | null; role: string | null };
        Insert: { id?: string; partner_id: string; name: string; title?: string | null; email?: string | null; phone?: string | null; role?: string | null };
        Update: { id?: string; partner_id?: string; name?: string; title?: string | null; email?: string | null; phone?: string | null; role?: string | null };
      };
      documents: {
        Row: { id: string; partner_id: string; storage_path: string; file_name: string; file_type: string | null; category: string | null; created_at: string | null; uploaded_at: string | null };
        Insert: { id?: string; partner_id: string; storage_path: string; file_name: string; file_type?: string | null; category?: string | null; created_at?: string | null; uploaded_at?: string | null };
        Update: { id?: string; partner_id?: string; storage_path?: string; file_name?: string; file_type?: string | null; category?: string | null; created_at?: string | null; uploaded_at?: string | null };
      };
      activity: {
        Row: { id: string; partner_id: string; date: string | null; type: string | null; note: string | null };
        Insert: { id?: string; partner_id: string; date?: string | null; type?: string | null; note?: string | null };
        Update: { id?: string; partner_id?: string; date?: string | null; type?: string | null; note?: string | null };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
