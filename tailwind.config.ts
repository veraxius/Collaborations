import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#f0f7ff",
          100: "#e0efff",
          500: "#0071e3",
          600: "#0062c4",
          700: "#0051a3",
          950: "#0a1420",
        },
        /* ========================================
           BASE COLORS
           ======================================== */
        background: {
          DEFAULT: "#F7F9FB",
          dark: "#0F1115",
        },
        foreground: {
          DEFAULT: "#111827",
          dark: "#F9FAFB",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#F9FAFB",
          dark: "#1A1D23",
          "elevated-dark": "#242830",
        },

        /* ========================================
           PRIMARY - Trust Blue
           ======================================== */
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },

        /* ========================================
           SECONDARY - AI Violet
           ======================================== */
        secondary: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          DEFAULT: "#7C3AED",
          foreground: "#FFFFFF",
        },

        /* ========================================
           SUCCESS
           ======================================== */
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
        },

        /* ========================================
           WARNING
           ======================================== */
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          DEFAULT: "#F59E0B",
          foreground: "#111827",
        },

        /* ========================================
           ERROR / DESTRUCTIVE
           ======================================== */
        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },

        /* ========================================
           TEXT COLORS
           ======================================== */
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
        "text-tertiary": "#9CA3AF",
        "text-inverse": "#FFFFFF",

        /* ========================================
           BORDER & DIVIDER
           ======================================== */
        border: {
          light: "#E5E7EB",
          DEFAULT: "#D1D5DB",
          dark: "#9CA3AF",
        },

        /* ========================================
           MUTED
           ======================================== */
        muted: {
          DEFAULT: "#F9FAFB",
          foreground: "#6B7280",
        },

        /* ========================================
           CARDS
           ======================================== */
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },

        /* ========================================
           INPUT & RING
           ======================================== */
        input: "#D1D5DB",
        ring: "#2563EB",

        /* ========================================
           CHART COLORS
           ======================================== */
        chart: {
          "1": "#2563EB",
          "2": "#7C3AED",
          "3": "#10B981",
          "4": "#F59E0B",
          "5": "#EF4444",
        },

        /* Legacy support */
        gold: "#c9a84c",
        "gold-light": "#f0dfa0",
      },

      /* ========================================
         BORDER RADIUS
         ======================================== */
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
        xs: "4px",
        DEFAULT: "10px",
      },

      /* ========================================
         SHADOWS
         ======================================== */
      boxShadow: {
        soft: "0 0 0 1px rgba(0,0,0,0.04)",
        lift: "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.08)",
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        none: "none",
      },

      /* ========================================
         FONTS
         ======================================== */
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },

      /* ========================================
         ANIMATIONS
         ======================================== */
      animation: {
        "fade-up": "fadeUp 0.4s ease both",
        "fade-in": "fadeIn 0.3s ease both",
        "slide-in": "slideIn 0.3s ease both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },

      /* ========================================
         SPACING
         ======================================== */
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
