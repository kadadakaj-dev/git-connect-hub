"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient, ServiceRow } from "../../utils/supabase/client";

export function ServiceManager() {
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingService, setEditingService] = useState<Partial<ServiceRow> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-api-key";

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/tenants/tenant_1/services`, {
                headers: { "x-api-key": API_KEY }
            });
            if (!res.ok) throw new Error("Failed to fetch services");
            const data = await res.json();
            // Map snake_case to camelCase if API returns camelCase, but since I use (this.prisma as any).service, 
            // Prisma will return what's in the DB which is snake_case if mapped, or camelCase if not.
            // My schema.prisma says:
            // model Service {
            //   id          BigInt   @id @default(autoincrement())
            //   title       String
            //   description String?
            //   price       Decimal  @db.Decimal(10, 2)
            //   durationMin Int      @map("duration_min")
            //   isActive    Boolean  @default(true) @map("is_active")
            //   ...
            // }
            // So Prisma returns durationMin and isActive. I need to map them back to snake_case for the UI or update UI.
            // I'll update UI to use camelCase internally.
            const normalized = data.map((s: any) => ({
                ...s,
                id: s.id.toString(),
                duration_min: s.durationMin,
                is_active: s.isActive
            }));
            setServices(normalized);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-api-key";
        if (!editingService) return;

        setIsSaving(true);
        const payload = {
            title: editingService.title,
            description: editingService.description,
            price: Number(editingService.price),
            durationMin: Number(editingService.duration_min),
            isActive: editingService.is_active ?? true,
        };

        try {
            let res;
            if (editingService.id) {
                res = await fetch(`${API_BASE}/api/tenants/tenant_1/services/${editingService.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_BASE}/api/tenants/tenant_1/services`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) throw new Error("Failed to save service");
            setEditingService(null);
            await fetchServices();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (service: ServiceRow) => {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-api-key";

        try {
            const res = await fetch(`${API_BASE}/api/tenants/tenant_1/services/${service.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
                body: JSON.stringify({ isActive: !service.is_active })
            });
            if (!res.ok) throw new Error("Failed to toggle status");
            await fetchServices();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteService = async (id: string) => {
        if (!confirm("Naozaj chcete zmazať túto službu?")) return;
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-api-key";

        try {
            const res = await fetch(`${API_BASE}/api/tenants/tenant_1/services/${id}`, {
                method: "DELETE",
                headers: { "x-api-key": API_KEY }
            });
            if (!res.ok) throw new Error("Failed to delete service");
            await fetchServices();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <section className="glass-edge mt-6 rounded-2xl bg-card/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Správa služieb</h2>
                    <p className="text-sm text-muted-foreground">Pridávajte, upravujte alebo deaktivujte služby salónu.</p>
                </div>
                <button
                    onClick={() => setEditingService({ title: "", price: 0, duration_min: 30, is_active: true })}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                    Pridať službu
                </button>
            </div>

            {editingService && (
                <div className="mb-8 rounded-2xl bg-secondary p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">
                        {editingService.id ? "Upraviť službu" : "Nová služba"}
                    </h3>
                    <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                            <label htmlFor="service-title" className="text-xs font-medium text-muted-foreground">Názov služby</label>
                            <input
                                id="service-title"
                                required
                                type="text"
                                value={editingService.title || ""}
                                onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                                className="w-full rounded-lg border border-border bg-input p-2.5 text-sm text-foreground"
                                placeholder="napr. Dámsky strih"
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="service-price" className="text-xs font-medium text-muted-foreground">Cena (€)</label>
                            <input
                                id="service-price"
                                required
                                type="number"
                                step="0.01"
                                title="Cena služby v eurách"
                                placeholder="0.00"
                                value={editingService.price || 0}
                                onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                                className="w-full rounded-lg border border-border bg-input p-2.5 text-sm text-foreground"
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="service-duration" className="text-xs font-medium text-muted-foreground">Trvanie (min)</label>
                            <input
                                id="service-duration"
                                required
                                type="number"
                                title="Trvanie služby v minútach"
                                placeholder="30"
                                value={editingService.duration_min || 0}
                                onChange={(e) => setEditingService({ ...editingService, duration_min: Number(e.target.value) })}
                                className="w-full rounded-lg border border-border bg-input p-2.5 text-sm text-foreground"
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="service-description" className="text-xs font-medium text-muted-foreground">Popis (voliteľné)</label>
                            <input
                                id="service-description"
                                type="text"
                                title="Stručný popis služby"
                                placeholder="Stručný popis"
                                value={editingService.description || ""}
                                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                                className="w-full rounded-lg border border-border bg-input p-2.5 text-sm text-foreground"
                            />
                        </div>
                        <div className="flex items-center gap-4 md:col-span-2">
                            <button
                                disabled={isSaving}
                                type="submit"
                                className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {isSaving ? "Ukladám..." : "Uložiť zmeny"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingService(null)}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                Zrušiť
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Načítavam služby...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="pb-3 font-semibold text-muted-foreground">Služba</th>
                                <th className="pb-3 font-semibold text-muted-foreground">Trvanie</th>
                                <th className="pb-3 font-semibold text-muted-foreground">Cena</th>
                                <th className="pb-3 font-semibold text-muted-foreground">Stav</th>
                                <th className="pb-3 font-semibold text-muted-foreground text-right">Akcie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {services.map((service) => (
                                <tr key={service.id} className="group transition-colors hover:bg-secondary/50">
                                    <td className="py-4">
                                        <p className="font-semibold text-foreground">{service.title}</p>
                                        {service.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                                        )}
                                    </td>
                                    <td className="py-4 text-muted-foreground">{service.duration_min} min</td>
                                    <td className="py-4 font-medium text-foreground">{Number(service.price).toFixed(2)} €</td>
                                    <td className="py-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${service.is_active
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-secondary text-muted-foreground"
                                                }`}
                                        >
                                            {service.is_active ? "Aktívna" : "Neaktívna"}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => toggleStatus(service)}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                {service.is_active ? "Deaktivovať" : "Aktivovať"}
                                            </button>
                                            <button
                                                onClick={() => setEditingService(service)}
                                                className="text-xs font-medium text-muted-foreground hover:underline hover:text-foreground"
                                            >
                                                Upraviť
                                            </button>
                                            <button
                                                onClick={() => deleteService(service.id)}
                                                className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                                            >
                                                Zmazať
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                                        Žiadne služby neboli nájdené.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
