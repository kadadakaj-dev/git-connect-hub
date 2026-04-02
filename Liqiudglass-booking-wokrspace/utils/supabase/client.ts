"use client";

import { SupabaseClient, createClient } from "@supabase/supabase-js";

export type DbBookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  avatar_url: string | null;
};

export type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration_min: number;
  is_active: boolean;
  gender?: string;
  category?: string;
};

export type BookingRow = {
  id: string;
  user_id: string | null;
  service_id: number;
  start_time: string;
  end_time: string;
  status: DbBookingStatus;
  notes: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  services?: { title: string; price: number; duration_min: number } | null;
};

export type BusinessSettingsRow = {
  id: string;
  shop_name: string;
  opening_hours_json: Record<string, unknown>;
  currency: string;
};

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}
