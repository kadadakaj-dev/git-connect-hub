"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";

const NAV_LINKS = [
  { label: "Rezervácia", href: "/" },
  { label: "Cenník", href: "/#sluzby" },
  { label: "Kontakt", href: "https://papihairdesign.sk", external: true },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm transition-colors duration-500">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center">
         <span className="text-xl font-bold tracking-tight text-foreground">
            Papi Hair Design
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
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isActive(href)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side: auth & theme toggle */}
        <div className="hidden items-center gap-4 sm:flex">
          <ThemeToggle />

          <div className="flex items-center gap-2">
            {!loading && isAuthenticated ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
                >
                  <LayoutDashboard size={14} />
                  Admin
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  title={user?.email}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border-gold hover:text-foreground"
                >
                  <LogOut size={14} />
                  Odhlásiť
                </button>
              </>
            ) : !loading ? (
              <Link
                href="/login"
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border-gold hover:text-foreground"
              >
                Prihlásiť sa
              </Link>
            ) : null}
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-secondary/50"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 sm:hidden">
          <nav className="mt-2 flex flex-col gap-1">
            {NAV_LINKS.map(({ label, href, external }) => (
              <Link
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(href)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
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
                  className="flex items-center gap-2 rounded-xl bg-foreground px-3 py-2.5 text-sm font-medium text-background"
                >
                  <LayoutDashboard size={14} />
                  Admin panel
                </Link>
                <button
                  type="button"
                  onClick={() => { void logout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  <LogOut size={14} />
                  Odhlásiť sa
                </button>
              </>
            )}

            {!loading && !isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                Prihlásiť sa
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
