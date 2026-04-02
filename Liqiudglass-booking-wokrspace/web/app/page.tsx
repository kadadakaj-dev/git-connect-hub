"use client";

export const dynamic = "force-static";


import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Clock, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { getSupabaseClient } from "../utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type DbService = {
  id: number;
  title: string;
  price: number;
  duration_min: number;
  gender: string;
  category: string;
};

type Category = { name: string; services: DbService[] };

type Step = "service" | "time" | "contact" | "done";

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 }
};

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

function buildCategories(services: DbService[], gender: string): Category[] {
  const filtered = services.filter((s) => s.gender === gender);
  const map = new Map<string, DbService[]>();
  for (const s of filtered) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push(s);
  }
  return Array.from(map.entries()).map(([name, svcs]) => ({ name, services: svcs }));
}

function addMinutes(slot: string, minutes: number): string {
  const [h, m] = slot.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-api-key";

export default function Page() {
  const [services, setServices] = useState<DbService[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [gender, setGender] = useState<"damsky" | "pansky">("damsky");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [slot, setSlot] = useState<string | null>(null);
  const [apiSlots, setApiSlots] = useState<{ startAt: string; endAt: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<Step>("service");

  // Contact form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;
    sb.from("services")
      .select("id, title, price, duration_min, gender, category")
      .eq("is_active", true)
      .order("id")
      .then(({ data, error }) => {
        if (error || !data) { setLoadError(true); return; }
        setServices(data as DbService[]);
      });
  }, []);

  // Fetch slots from API
  useEffect(() => {
    if (!serviceId || !date) {
      setApiSlots([]);
      return;
    }

    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const res = await fetch(`${API_BASE}/api/tenants/tenant_1/slots?from=${date}&serviceId=${serviceId}`, {
          headers: { "x-api-key": API_KEY }
        });
        if (!res.ok) throw new Error("Failed to fetch slots");
        const data = await res.json();
        setApiSlots(data);
      } catch (err) {
        console.error(err);
        setApiSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [serviceId, date]);

  const categories = useMemo(() => buildCategories(services, gender), [services, gender]);

  useEffect(() => {
    setServiceId(null);
    setSlot(null);
    setStep("service");
    if (categories.length > 0) setOpenCategories(new Set([categories[0].name]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, categories.length]);

  useEffect(() => { setSlot(null); }, [serviceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  const toggleCategory = (name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  async function handleBook() {
    if (!selectedService || !slot || !name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    const startTime = apiSlots.find(s => s.startAt.includes(slot))?.startAt;
    const endTime = apiSlots.find(s => s.startAt.includes(slot))?.endAt;

    if (!startTime || !endTime) {
      setSubmitError("Neplatný časový slot.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tenants/tenant_1/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({
          serviceId: selectedService.id.toString(),
          startAt: startTime,
          endAt: endTime,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || null,
          notes: notes.trim() || null,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Rezerváciu sa nepodarilo uložiť.");
      }

      // Fire festive confetti on success!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#d4af37", "#f9f6ee", "#ffffff"],
      });

      setStep("done");
    } catch (err: any) {
      setSubmitError(err.message || "Skúste znova neskôr.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── DONE screen ──────────────────────────────────────────────
  if (step === "done") {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 transition-colors duration-500">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 size={56} className="mx-auto mb-4 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Rezervácia odoslaná!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Potvrdzujeme vašu rezerváciu — čoskoro vás kontaktujeme.
          </p>
          <div className="mt-6 rounded-2xl border border-border-gold bg-secondary/50 backdrop-blur-sm p-5 text-left shadow-xl shadow-primary/5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Služba</span>
                <span className="font-medium text-foreground">{selectedService?.title}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Čas</span>
                <span className="font-medium text-foreground">{date} o {slot}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Meno</span>
                <span className="font-medium text-foreground">{name}</span>
              </div>
              <div className="flex justify-between border-t border-border-gold pt-2">
                <span className="font-semibold text-foreground">Celkom</span>
                <span className="font-bold text-primary">{selectedService?.price.toFixed(2)} €</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("service"); setServiceId(null); setSlot(null); setDate(new Date().toISOString().split("T")[0]);
              setName(""); setPhone(""); setEmail(""); setNotes("");
            }}
            className="mt-6 w-full rounded-2xl border border-border-gold py-3 text-sm font-medium text-foreground hover:bg-secondary transition-all"
          >
            Nová rezervácia
          </button>
        </motion.div>
      </main>
    );
  }

  // ── MAIN flow ────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background transition-colors duration-500">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Gender tabs */}
        <div id="sluzby" className="mb-6 flex rounded-2xl border border-border-gold bg-secondary/50 backdrop-blur-sm p-1 shadow-lg shadow-primary/5">
          {(["damsky", "pansky"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${gender === g ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {g === "damsky" ? "Dámsky cenník" : "Pánsky cenník"}
            </button>
          ))}
        </div>

        {/* KROK 1 – Výber služby */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            1. Vyberte službu
          </p>

          {loadError && (
            <p className="rounded-2xl border border-red-200 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              Nepodarilo sa načítať služby. Skúste obnoviť stránku.
            </p>
          )}
          {!loadError && services.length === 0 && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-secondary" />)}
            </div>
          )}

          <div className="space-y-2">
            {categories.map((cat) => {
              const isOpen = openCategories.has(cat.name);
              return (
                <motion.div
                  key={cat.name}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-border-gold bg-secondary/30 shadow-sm transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="font-semibold text-foreground">{cat.name}</span>
                    {isOpen ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-primary" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border-gold"
                      >
                        {cat.services.map((s) => (
                          <motion.button
                            key={s.id}
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setServiceId(s.id); setStep("time"); }}
                            className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-primary/5 ${serviceId === s.id ? "bg-primary/10" : ""
                              }`}
                          >
                            <div>
                              <p className={`text-sm font-medium ${serviceId === s.id ? "text-primary" : "text-foreground"}`}>
                                {s.title}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock size={11} /> {s.duration_min} min
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${serviceId === s.id ? "text-primary" : "text-foreground"}`}>
                              {s.price.toFixed(2)} €
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* KROK 2 – Výber času */}
        <AnimatePresence mode="wait">
          {selectedService && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                2. Vyberte dátum a čas
              </p>
              <div className="mb-4">
                <input
                  type="date"
                  aria-label="Dátum rezervácie"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border-gold bg-secondary/30 px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-foreground"
                />
              </div>
              <div className="rounded-2xl border border-border-gold bg-secondary/30 p-4 shadow-sm">
                {loadingSlots ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : apiSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 [&>button]:min-h-[44px]">
                    {apiSlots.map((s) => {
                      const timeString = new Date(s.startAt).toLocaleTimeString("sk-SK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <motion.button
                          key={s.startAt}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setSlot(timeString); setStep("contact"); }}
                          className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${slot === timeString
                            ? "border-primary bg-primary text-primary-foreground shadow-glow scale-105"
                            : "border-border text-foreground hover:border-primary/50 hover:text-primary hover:shadow-sm"
                            }`}
                        >
                          {timeString}
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Žiadne voľné termíny na tento deň.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KROK 3 – Kontaktné údaje */}
        <AnimatePresence>
          {selectedService && slot && step === "contact" && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-6"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                3. Vaše údaje
              </p>
              <div className="rounded-2xl border border-border-gold bg-secondary/30 p-5 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Meno a priezvisko <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ján Novák"
                      className="w-full rounded-xl border border-border bg-input text-foreground px-3.5 py-2.5 text-base sm:text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Telefón <span className="text-primary">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+421 900 000 000"
                      className="w-full rounded-xl border border-border bg-input text-foreground px-3.5 py-2.5 text-base sm:text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      E-mail <span className="text-muted-foreground text-xs font-normal">(nepovinné)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jan@email.sk"
                      className="w-full rounded-xl border border-border bg-input text-foreground px-3.5 py-2.5 text-base sm:text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Poznámka <span className="text-muted-foreground text-xs font-normal">(nepovinné)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Napr. prvá návšteva, alergia na farbu..."
                      rows={2}
                      className="w-full resize-none rounded-xl border border-border bg-input text-foreground px-3.5 py-2.5 text-base sm:text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zhrnutie */}
        {selectedService && slot && (
          <div className="mb-5 rounded-2xl border border-border-gold bg-secondary/30 p-5 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            <h3 className="mb-3 font-semibold text-foreground">Zhrnutie</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Služba</span>
                <span className="font-medium text-foreground">{selectedService.title}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Trvanie</span>
                <span className="font-medium text-foreground">{selectedService.duration_min} min</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Čas</span>
                <span className="font-medium text-foreground">{date} o {slot}</span>
              </div>
              <div className="flex justify-between border-t border-border-gold pt-2">
                <span className="font-semibold text-foreground">Celkom</span>
                <span className="font-bold text-primary">{selectedService.price.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <p className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">{submitError}</p>
        )}

        {/* CTA tlačidlo */}
        <button
          type="button"
          disabled={!selectedService || !slot || (step === "contact" && (!name.trim() || !phone.trim())) || submitting}
          onClick={step === "contact" ? handleBook : () => setStep("contact")}
          className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-glow transition-all hover:shadow-glow-lg hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Odosielam...
            </span>
          ) : step === "contact" && selectedService && slot ? (
            `Rezervovať – ${selectedService.title} o ${slot}`
          ) : selectedService && slot ? (
            "Vyplňte kontaktné údaje"
          ) : (
            "Vyberte službu a čas"
          )}
        </button>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <ShieldCheck size={13} className="text-primary/60" /> Zabezpečené – vaše údaje sú v bezpečí
        </p>

      </div>
    </main>
  );
}
