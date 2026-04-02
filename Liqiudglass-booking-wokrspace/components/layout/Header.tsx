"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, Scissors } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_LINKS = [
  { label: "Rezervacia", href: "/" },
  { label: "Cennik", href: "/#sluzby" },
  { label: "Kontakt", href: "https://papihairdesign.sk", external: true },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user, logout, loading } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass bar */}
      <div className="liquid-glass-strong border-0 border-b border-glass-border">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:shadow-glow-sm">
              <Scissors size={18} className="text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Papi Hair
              <span className="text-primary"> Design</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map(({ label, href, external }) => (
              <Link
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className={`relative rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                  isActive(href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive(href) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl liquid-glass-subtle"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden items-center gap-3 sm:flex">
            <ThemeToggle />

            {!loading && isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-glow-sm transition-all hover:shadow-glow"
                >
                  <LayoutDashboard size={14} />
                  Admin
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  title={user?.email}
                  className="flex items-center gap-1.5 rounded-xl liquid-glass-subtle px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:border-border-gold"
                >
                  <LogOut size={14} />
                  <span className="sr-only sm:not-sr-only">Odhlasit</span>
                </button>
              </div>
            ) : !loading ? (
              <Link
                href="/login"
                className="rounded-xl liquid-glass-subtle px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:border-border-gold"
              >
                Prihlasit sa
              </Link>
            ) : null}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass-subtle text-muted-foreground transition-all hover:text-foreground"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden sm:hidden"
          >
            <div className="liquid-glass-strong border-0 border-t border-glass-border px-4 pb-4">
              <nav className="mt-2 flex flex-col gap-1">
                {NAV_LINKS.map(({ label, href, external }) => (
                  <Link
                    key={href}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive(href)
                        ? "liquid-glass-subtle text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                ))}

                {!loading && isAuthenticated && (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-glow-sm"
                    >
                      <LayoutDashboard size={14} />
                      Admin panel
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        void logout();
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-xl liquid-glass-subtle px-3 py-2.5 text-sm font-medium text-muted-foreground"
                    >
                      <LogOut size={14} />
                      Odhlasit sa
                    </button>
                  </>
                )}

                {!loading && !isAuthenticated && (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl liquid-glass-subtle px-3 py-2.5 text-sm font-medium text-muted-foreground"
                  >
                    Prihlasit sa
                  </Link>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
