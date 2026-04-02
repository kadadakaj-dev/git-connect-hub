"use client";

import type { BookingRow } from "../../../utils/supabase/client";

const statusStyles: Record<BookingRow["status"], string> = {
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
};

export function LiveCalendar({
  bookings,
  onApprove,
  onCancel
}: {
  bookings: BookingRow[];
  onApprove: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
}) {
  return (
    <section className="glass-edge rounded-2xl bg-card/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
      <h2 className="text-2xl font-semibold text-foreground">Live Kalendár</h2>
      <p className="mt-1 text-sm text-muted-foreground">Nadchádzajúce rezervácie zoradené podľa času.</p>

      <div className="mt-4 space-y-3">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žiadne nadchádzajúce rezervácie.</p>
        ) : (
          bookings.map((booking) => (
            <article
              key={booking.id}
              className="flex flex-col gap-3 glass-edge rounded-2xl bg-secondary p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{booking.services?.title ?? "Service"}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(booking.start_time).toLocaleString("sk-SK")} – {new Date(booking.end_time).toLocaleTimeString("sk-SK")}
                </p>
                {booking.customer_name && (
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {booking.customer_name}
                  </p>
                )}
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {booking.customer_email && <span>{booking.customer_email}</span>}
                  {booking.customer_phone && <span>{booking.customer_phone}</span>}
                  {booking.notes && <span className="italic">&ldquo;{booking.notes}&rdquo;</span>}
                </div>
              </div>
              <div className="flex gap-2 md:shrink-0">
                <button
                  onClick={() => onApprove(booking.id)}
                  className="h-11 min-h-[44px] flex-1 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white active:scale-95 md:flex-none"
                >
                  Schváliť
                </button>
                <button
                  onClick={() => onCancel(booking.id)}
                  className="h-11 min-h-[44px] flex-1 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white active:scale-95 md:flex-none"
                >
                  Zrušiť
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
