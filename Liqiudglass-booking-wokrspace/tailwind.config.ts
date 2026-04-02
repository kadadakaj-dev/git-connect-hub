import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        "border-gold": "var(--border-gold)",
        glass: {
          bg: "var(--glass-bg)",
          "bg-strong": "var(--glass-bg-strong)",
          border: "var(--glass-border)",
          highlight: "var(--glass-highlight)",
        },
      },
      boxShadow: {
        glow: "0 4px 14px 0 rgba(212, 175, 55, 0.4)",
        "glow-lg": "0 8px 28px rgba(212, 175, 55, 0.5)",
        "glow-sm": "0 2px 8px rgba(212, 175, 55, 0.25)",
        glass: "0 8px 32px var(--glass-shadow), var(--glass-inner-shadow)",
        "glass-lg": "0 16px 48px var(--glass-shadow), var(--glass-inner-shadow)",
        "glass-glow": "0 8px 32px var(--glass-shadow), 0 0 20px rgba(212, 175, 55, 0.15)",
      },
      backdropBlur: {
        glass: "20px",
        "glass-strong": "40px",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
