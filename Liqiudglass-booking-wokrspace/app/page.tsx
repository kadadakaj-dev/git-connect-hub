"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
  Calendar,
} from "lucide-react";
import { getSupabaseClient } from "@/utils/supabase/client";
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

const TIME_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","13:00","13:30","14:00",
  "14:30","15:00","15:30","16:00","16:30","17:00",
];

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "service", label: "Sluzba", icon: <Sparkles size={14} /> },
  { key: "time", label: "Termin", icon: <Calendar size={14} /> },
  { key: "contact", label: "Udaje", icon: <User size={14} /> },
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

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {STEPS.map((s, i) => {
        const isActive = i === stepIndex;
        const isDone = i < stepIndex;
        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 transition-all duration-500 ${
                  isDone ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                isActive
                  ? "liquid-glass-strong text-primary shadow-glow-sm"
                  : isDone
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const [services, setServices] = useState<DbService[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [gender, setGender] = useState<"damsky" | "pansky">("damsky");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [slot, setSlot] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("service");

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

  const toggleCategory = (catName: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName); else next.add(catName);
      return next;
    });
  };

  async function handleBook() {
    if (!selectedService || !slot || !name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const sb = getSupabaseClient();
    if (!sb) { setSubmitError("Chyba pripojenia."); setSubmitting(false); return; }

    const start = `${date}T${slot}:00`;
    const end = `${date}T${addMinutes(slot, selectedService.duration_min)}:00`;

    const { error } = await sb.from("bookings").insert({
      service_id: selectedService.id,
      start_time: start,
      end_time: end,
      status: "pending",
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      notes: notes.trim() || null,
    });

    if (error) {
      setSubmitError("Rezervaciu sa nepodarilo ulozit. Skuste znova.");
      setSubmitting(false);
      return;
    }

    confetti({
      particleCount: 200,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#d4af37", "#f9f6ee", "#ffffff", "#8a6d3b"],
    });

    setStep("done");
    setSubmitting(false);
  }

  // DONE screen
  if (step === "done") {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Rezervacia odoslana!</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Potvrdzujeme vasu rezervaciu -- coskoro vas kontaktujeme.
          </p>
          <div className="mt-6 rounded-2xl liquid-glass glass-edge p-5 text-left shadow-glass-glow">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sluzba</span>
                <span className="font-medium text-foreground">{selectedService?.title}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cas</span>
                <span className="font-medium text-foreground">{date} o {slot}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Meno</span>
                <span className="font-medium text-foreground">{name}</span>
              </div>
              <div className="flex justify-between border-t border-glass-border pt-2.5">
                <span className="font-semibold text-foreground">Celkom</span>
                <span className="font-bold text-primary">{selectedService?.price.toFixed(2)} EUR</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("service"); setServiceId(null); setSlot(null);
              setDate(new Date().toISOString().split("T")[0]);
              setName(""); setPhone(""); setEmail(""); setNotes("");
            }}
            className="mt-6 w-full rounded-2xl liquid-glass py-3 text-sm font-medium text-foreground transition-all hover:shadow-glass-glow"
          >
            Nova rezervacia
          </button>
        </motion.div>
      </main>
    );
  }

  // MAIN FLOW
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">

        <StepIndicator currentStep={step} />

        {/* Gender tabs */}
        <div
          id="sluzby"
          className="mb-8 flex rounded-2xl liquid-glass glass-edge p-1 shadow-glass"
        >
          {(["damsky", "pansky"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`relative flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                gender === g
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {gender === g && (
                <motion.span
                  layoutId="gender-pill"
                  className="absolute inset-0 rounded-xl bg-primary shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {g === "damsky" ? "Damsky cennik" : "Pansky cennik"}
              </span>
            </button>
          ))}
        </div>

        {/* Step 1: Service Selection */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            1. Vyberte sluzbu
          </p>

          {loadError && (
            <div className="rounded-2xl liquid-glass border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Nepodarilo sa nacitat sluzby. Skuste obnovit stranku.
            </div>
          )}
          {!loadError && services.length === 0 && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-2xl glass-skeleton" />
              ))}
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
                  className="overflow-hidden rounded-2xl liquid-glass glass-edge"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                  >
                    <span className="font-semibold text-foreground">{cat.name}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} className="text-primary" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-glass-border"
                      >
                        {cat.services.map((s) => {
                          const selected = serviceId === s.id;
                          return (
                            <motion.button
                              key={s.id}
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => { setServiceId(s.id); setStep("time"); }}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left transition-all ${
                                selected
                                  ? "bg-primary/8 shadow-inner"
                                  : "hover:bg-glass-highlight/50"
                              }`}
                            >
                              <div>
                                <p className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}>
                                  {s.title}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock size={11} /> {s.duration_min} min
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${selected ? "text-primary" : "text-foreground"}`}>
                                  {s.price.toFixed(2)} EUR
                                </span>
                                {selected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="h-2 w-2 rounded-full bg-primary shadow-glow-sm"
                                  />
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Date & Time */}
        <AnimatePresence mode="wait">
          {selectedService && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                2. Vyberte datum a cas
              </p>
              <div className="mb-4">
                <input
                  type="date"
                  aria-label="Datum rezervacie"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl glass-input px-4 py-3 text-base text-foreground outline-none"
                />
              </div>
              <div className="rounded-2xl liquid-glass glass-edge p-4">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 [&>button]:min-h-[44px]">
                  {TIME_SLOTS.map((time) => {
                    const selected = slot === time;
                    return (
                      <motion.button
                        key={time}
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { setSlot(time); setStep("contact"); }}
                        className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-glow"
                            : "border-glass-border text-foreground hover:border-primary/40 hover:text-primary hover:shadow-glow-sm"
                        }`}
                      >
                        {time}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Contact Info */}
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
                3. Vase udaje
              </p>
              <div className="rounded-2xl liquid-glass glass-edge p-5">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Meno a priezvisko <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jan Novak"
                      className="w-full rounded-xl glass-input px-3.5 py-2.5 text-base sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Telefon <span className="text-primary">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+421 900 000 000"
                      className="w-full rounded-xl glass-input px-3.5 py-2.5 text-base sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      E-mail <span className="text-xs font-normal text-muted-foreground">(nepovinne)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jan@email.sk"
                      className="w-full rounded-xl glass-input px-3.5 py-2.5 text-base sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Poznamka <span className="text-xs font-normal text-muted-foreground">(nepovinne)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Napr. prva navsteva, alergia na farbu..."
                      rows={2}
                      className="w-full resize-none rounded-xl glass-input px-3.5 py-2.5 text-base sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary card */}
        {selectedService && slot && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-5 overflow-hidden rounded-2xl liquid-glass-strong glass-edge p-5 shadow-glass-glow"
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
            <h3 className="mb-3 font-semibold text-foreground">Zhrnutie</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sluzba</span>
                <span className="font-medium text-foreground">{selectedService.title}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Trvanie</span>
                <span className="font-medium text-foreground">{selectedService.duration_min} min</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cas</span>
                <span className="font-medium text-foreground">{date} o {slot}</span>
              </div>
              <div className="flex justify-between border-t border-glass-border pt-2.5">
                <span className="font-semibold text-foreground">Celkom</span>
                <span className="font-bold text-primary text-base">{selectedService.price.toFixed(2)} EUR</span>
              </div>
            </div>
          </motion.div>
        )}

        {submitError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 rounded-2xl liquid-glass border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {submitError}
          </motion.p>
        )}

        {/* CTA Button */}
        <motion.button
          type="button"
          disabled={!selectedService || !slot || (step === "contact" && (!name.trim() || !phone.trim())) || submitting}
          onClick={step === "contact" ? handleBook : () => setStep("contact")}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-glow transition-all hover:shadow-glow-lg active:shadow-glow-sm disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Odosielam...
            </span>
          ) : step === "contact" && selectedService && slot ? (
            `Rezervovat - ${selectedService.title} o ${slot}`
          ) : selectedService && slot ? (
            "Vyplnte kontaktne udaje"
          ) : (
            "Vyberte sluzbu a cas"
          )}
        </motion.button>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <ShieldCheck size={13} className="text-primary/60" /> Zabezpecene - vase udaje su v bezpeci
        </p>
      </div>
    </main>
  );
}
