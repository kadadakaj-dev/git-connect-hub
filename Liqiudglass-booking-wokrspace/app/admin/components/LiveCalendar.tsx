"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BookingRow } from "@/utils/supabase/client";
import { Check, X } from "lucide-react";

const statusStyles: Record<BookingRow["status"], string> = {
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

export function LiveCalendar({
  bookings,
  onApprove,
  onCancel,
}: {
  bookings: BookingRow[];
  onApprove: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
}) {
  return (
    <section className="rounded-2xl liquid-glass glass-edge p-5">
      <h2 className="text-lg font-semibold text-foreground">Live Kalendar</h2>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        Nadchadzajuce rezervacie zoradene podla casu.
      </p>

      <div className="mt-4 space-y-3">
        <AnimatePresence>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Ziadne nadchadzajuce rezervacie.
            </p>
          ) : (
            bookings.map((booking, i) => (
              <motion.article
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col gap-3 rounded-2xl liquid-glass-subtle p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {booking.services?.title ?? "Service"}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.start_time).toLocaleString("sk-SK")} -{" "}
                    {new Date(booking.end_time).toLocaleTimeString("sk-SK")}
                  </p>
                  {booking.customer_name && (
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {booking.customer_name}
                    </p>
                  )}
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {booking.customer_email && <span>{booking.customer_email}</span>}
                    {booking.customer_phone && <span>{booking.customer_phone}</span>}
                    {booking.notes && (
                      <span className="italic">{'"'}{booking.notes}{'"'}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 md:shrink-0">
                  <button
                    onClick={() => onApprove(booking.id)}
                    className="flex h-11 min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95 md:flex-none"
                  >
                    <Check size={14} />
                    Schvalit
                  </button>
                  <button
                    onClick={() => onCancel(booking.id)}
                    className="flex h-11 min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-4 text-sm font-semibold text-red-600 dark:text-red-400 transition-all hover:bg-red-500/20 active:scale-95 md:flex-none"
                  >
                    <X size={14} />
                    Zrusit
                  </button>
                </div>
              </motion.article>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
