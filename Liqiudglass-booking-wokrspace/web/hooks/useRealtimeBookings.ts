"use client";

import { useEffect, useMemo, useState } from "react";
import { BookingRow, getSupabaseClient } from "../utils/supabase/client";

type FeedItem = {
  id: string;
  type: "INSERT" | "UPDATE";
  bookingId: string;
  status: BookingRow["status"];
  at: string;
};

export function useRealtimeBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Missing Supabase environment variables.");
      setLoading(false);
      return;
    }

    const loadInitial = async () => {
      const { data, error: queryError } = await supabase
        .from("bookings")
        .select("id,user_id,service_id,start_time,end_time,status,notes,customer_name,customer_email,customer_phone,services(title,price,duration_min)")
        .order("start_time", { ascending: false })
        .limit(100);

      if (queryError) {
        setError(queryError.message);
      } else {
        const normalized = (data ?? []).map((booking) => {
          const row = booking as BookingRow & { services?: BookingRow["services"] | BookingRow["services"][] };
          return {
            ...row,
            services: Array.isArray(row.services) ? row.services[0] ?? null : row.services ?? null
          };
        }) as BookingRow[];
        setBookings(normalized);
      }
      setLoading(false);
    };

    void loadInitial();

    const channel = supabase
      .channel("bookings-live-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          const next = payload.new as BookingRow;
          setBookings((prev) => [next, ...prev.filter((item) => item.id !== next.id)]);
          setFeed((prev) => [
            {
              id: crypto.randomUUID(),
              type: "INSERT" as const,
              bookingId: next.id,
              status: next.status,
              at: new Date().toISOString()
            },
            ...prev
          ].slice(0, 20));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          const next = payload.new as BookingRow;
          setBookings((prev) => prev.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
          setFeed((prev) => [
            {
              id: crypto.randomUUID(),
              type: "UPDATE" as const,
              bookingId: next.id,
              status: next.status,
              at: new Date().toISOString()
            },
            ...prev
          ].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const bookingsToday = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return bookings.filter((booking) => {
      const t = new Date(booking.start_time).getTime();
      return t >= start.getTime() && t <= end.getTime();
    }).length;
  }, [bookings]);

  return {
    bookings,
    feed,
    bookingsToday,
    loading,
    error
  };
}
