"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient, ServiceRow } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";

export function ServiceManager() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Partial<ServiceRow> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    if (!error && data) setServices(data as ServiceRow[]);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase || !editingService) return;
    setIsSaving(true);

    const payload = {
      title: editingService.title,
      description: editingService.description,
      price: Number(editingService.price),
      duration_min: Number(editingService.duration_min),
      is_active: editingService.is_active ?? true,
      gender: editingService.gender ?? "damsky",
      category: editingService.category ?? "Ine",
    };

    let error;
    if (editingService.id) {
      const { error: err } = await supabase.from("services").update(payload).eq("id", editingService.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("services").insert([payload]);
      error = err;
    }

    if (!error) { setEditingService(null); await fetchServices(); }
    setIsSaving(false);
  };

  const toggleStatus = async (service: ServiceRow) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from("services").update({ is_active: !service.is_active }).eq("id", service.id);
    if (!error) await fetchServices();
  };

  const deleteService = async (id: string) => {
    if (!confirm("Naozaj chcete zmazat tuto sluzbu?")) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) await fetchServices();
  };

  return (
    <section className="rounded-2xl liquid-glass glass-edge p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sprava sluzieb</h2>
          <p className="text-sm text-muted-foreground">Pridavajte, upravujte alebo deaktivujte sluzby salonu.</p>
        </div>
        <button
          onClick={() => setEditingService({ title: "", price: 0, duration_min: 30, is_active: true, gender: "damsky", category: "Ine" })}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all hover:shadow-glow"
        >
          <Plus size={14} />
          Pridat
        </button>
      </div>

      <AnimatePresence>
        {editingService && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-2xl liquid-glass-subtle p-5">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                {editingService.id ? "Upravit sluzbu" : "Nova sluzba"}
              </h3>
              <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="svc-title" className="text-xs font-medium text-muted-foreground">Nazov</label>
                  <input id="svc-title" required type="text" value={editingService.title || ""}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full rounded-xl glass-input px-3 py-2.5 text-sm text-foreground outline-none" placeholder="napr. Damsky strih" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="svc-price" className="text-xs font-medium text-muted-foreground">Cena (EUR)</label>
                  <input id="svc-price" required type="number" step="0.01" value={editingService.price || 0}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full rounded-xl glass-input px-3 py-2.5 text-sm text-foreground outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="svc-duration" className="text-xs font-medium text-muted-foreground">Trvanie (min)</label>
                  <input id="svc-duration" required type="number" value={editingService.duration_min || 0}
                    onChange={(e) => setEditingService({ ...editingService, duration_min: Number(e.target.value) })}
                    className="w-full rounded-xl glass-input px-3 py-2.5 text-sm text-foreground outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="svc-desc" className="text-xs font-medium text-muted-foreground">Popis</label>
                  <input id="svc-desc" type="text" value={editingService.description || ""}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    className="w-full rounded-xl glass-input px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Strucny popis" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="svc-gender" className="text-xs font-medium text-muted-foreground">Pohlavie</label>
                  <select id="svc-gender" value={editingService.gender || "damsky"}
                    onChange={(e) => setEditingService({ ...editingService, gender: e.target.value })}
                    className="w-full rounded-xl glass-input px-3 py-2.5 text-sm text-foreground outline-none">
                    <option value="damsky">Damsky</option>
                    <option value="pansky">Pansky</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="svc-category" className="text-xs font-medium text-muted-foreground">Kategoria</label>
                  <input id="svc-category" type="text" value={editingService.category || ""}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full rounded-xl glass-input px-3 py-2.5 text-sm text-foreground outline-none" placeholder="napr. Strih & Styling" />
                </div>
                <div className="flex items-center gap-4 md:col-span-2">
                  <button disabled={isSaving} type="submit"
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all hover:shadow-glow disabled:opacity-50">
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    {isSaving ? "Ukladam..." : "Ulozit zmeny"}
                  </button>
                  <button type="button" onClick={() => setEditingService(null)}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Zrusit
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 size={20} className="mx-auto animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Nacitavam sluzby...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="pb-3 font-medium text-muted-foreground">Sluzba</th>
                <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Trvanie</th>
                <th className="pb-3 font-medium text-muted-foreground">Cena</th>
                <th className="pb-3 font-medium text-muted-foreground">Stav</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {services.map((service) => (
                <tr key={service.id} className="group transition-colors hover:bg-glass-highlight/30">
                  <td className="py-3.5">
                    <p className="font-medium text-foreground">{service.title}</p>
                    {service.description && <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>}
                    {service.gender && <p className="text-xs text-primary/60 mt-0.5">{service.gender} / {service.category}</p>}
                  </td>
                  <td className="py-3.5 text-muted-foreground hidden sm:table-cell">{service.duration_min} min</td>
                  <td className="py-3.5 font-medium text-foreground">{Number(service.price).toFixed(2)} EUR</td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      service.is_active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {service.is_active ? "Aktivna" : "Neaktivna"}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => toggleStatus(service)} className="text-xs font-medium text-primary hover:underline">
                        {service.is_active ? "Deaktivovat" : "Aktivovat"}
                      </button>
                      <button onClick={() => setEditingService(service)} className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">
                        Upravit
                      </button>
                      <button onClick={() => deleteService(service.id)} className="text-xs font-medium text-red-500 hover:underline">
                        Zmazat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Ziadne sluzby neboli najdene.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
