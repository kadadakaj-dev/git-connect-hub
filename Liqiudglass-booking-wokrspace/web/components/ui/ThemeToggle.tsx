"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="h-8 w-[60px] rounded-full bg-muted animate-pulse" />
        );
    }

    const isDark = theme === "dark";

    const toggleTheme = () => {
        const newTheme = isDark ? "light" : "dark";
        setTheme(newTheme);

        if (newTheme === "dark") {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.1 },
                colors: ["#d4af37", "#f9f6ee", "#8a6d3b"],
                gravity: 1.2,
            });
        } else {
            confetti({
                particleCount: 30,
                spread: 60,
                origin: { y: 0.1 },
                colors: ["#ffffff", "#f0f0f0", "#d4af37"],
                gravity: 1.2,
                scalar: 0.8,
            });
        }
    };

    const toggleProps = { "aria-pressed": isDark };

    return (
        <button
            type="button"
            {...toggleProps}
            aria-label={isDark ? "Prepnúť na svetlú tému" : "Prepnúť na tmavú tému"}
            onClick={toggleTheme}
            className="group relative flex h-8 w-[60px] cursor-pointer items-center rounded-full border border-border-gold bg-secondary/60 p-[3px] backdrop-blur-sm transition-all duration-500 hover:border-primary/60 hover:shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
            {/* Track background glow */}
            <div className="absolute inset-0 rounded-full bg-gold-gradient opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500" />

            {/* Sun icon (left side of track) */}
            <Sun
                className="absolute left-[7px] h-3.5 w-3.5 transition-all duration-500"
                style={{
                    color: isDark ? "var(--muted-foreground)" : "var(--primary)",
                    opacity: isDark ? 0.3 : 0,
                }}
            />

            {/* Moon icon (right side of track) */}
            <Moon
                className="absolute right-[7px] h-3.5 w-3.5 transition-all duration-500"
                style={{
                    color: isDark ? "var(--primary)" : "var(--muted-foreground)",
                    opacity: isDark ? 0 : 0.3,
                }}
            />

            {/* Sliding thumb */}
            <motion.div
                className="relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-background shadow-md shadow-primary/20 border border-border-gold/50"
                animate={{ x: isDark ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                <motion.div
                    key={isDark ? "moon" : "sun"}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {isDark ? (
                        <Moon className="h-3.5 w-3.5 text-primary" />
                    ) : (
                        <Sun className="h-3.5 w-3.5 text-primary" />
                    )}
                </motion.div>
            </motion.div>
        </button>
    );
}
