import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Ghost White / Carbon Black - iOS 26 Style
        ghost: {
          DEFAULT: "#F5F5F5",
          50: "#FFFFFF",
          100: "#FAFAFA",
          200: "#F5F5F5",
          300: "#EEEEEE",
          400: "#E0E0E0",
          500: "#BDBDBD",
        },
        carbon: {
          DEFAULT: "#141414",
          50: "#3D3D3D",
          100: "#2E2E2E",
          200: "#262626",
          300: "#1F1F1F",
          400: "#171717",
          500: "#141414",
          600: "#0F0F0F",
          700: "#0A0A0A",
        },
        // EKKO Brand Colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "#0051D4",
          50: "#E5F2FF",
          100: "#CCE5FF",
          200: "#99CCFF",
          300: "#66B2FF",
          400: "#3399FF",
          500: "#007AFF",
          600: "#0066CC",
          700: "#004D99",
          800: "#003366",
          900: "#001A33",
        },
        secondary: {
          DEFAULT: "#4A5C6A",
          foreground: "#FFFFFF",
          50: "#EDF0F2",
          100: "#DBE1E5",
          200: "#B7C3CB",
          300: "#93A5B1",
          400: "#6F8797",
          500: "#4A5C6A",
          600: "#3B4A55",
          700: "#2C3740",
          800: "#1E252B",
          900: "#0F1215",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          light: "#5AC8FA",
          dark: "#0051D4",
          50: "#E5F2FF",
          100: "#CCE5FF",
          200: "#99CCFF",
          300: "#66B2FF",
          400: "#3399FF",
          500: "#007AFF",
          600: "#0066CC",
          700: "#004D99",
          800: "#003366",
          900: "#001A33",
        },
        neutral: {
          DEFAULT: "#8D99AE",
          foreground: "#1A1D21",
          50: "#F4F5F7",
          100: "#E9EBEF",
          200: "#D3D7DF",
          300: "#BDC3CF",
          400: "#A7AFBF",
          500: "#8D99AE",
          600: "#6B7A8F",
          700: "#505B6B",
          800: "#353C47",
          900: "#1A1D24",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        dark: {
          DEFAULT: "#0F0F0F",
          foreground: "#F5F5F5",
        },
        // shadcn/ui compatible colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Hedvig Letters Sans", "sans-serif"],
        body: ["var(--font-body)", "Quattrocento Sans", "sans-serif"],
        sans: ["var(--font-body)", "Quattrocento Sans", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      spacing: {
        xs: "0.25rem", // 4px
        sm: "0.5rem", // 8px
        md: "1rem", // 16px
        lg: "1.5rem", // 24px
        xl: "2rem", // 32px
        "2xl": "3rem", // 48px
        "3xl": "4rem", // 64px
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backdropBlur: {
        xs: "4px",
        glass: "16px",
        "glass-lg": "24px",
        "glass-xl": "40px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.08)",
        "glass-lg": "0 16px 48px rgba(0, 0, 0, 0.12)",
        "glass-xl": "0 25px 50px rgba(0, 0, 0, 0.15)",
        "glass-glow": "0 0 20px rgba(255, 255, 255, 0.1)",
        "glass-inset": "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glass-dark-lg": "0 16px 48px rgba(0, 0, 0, 0.4)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        // Glass effect animations
        "glass-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glass-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "glass-glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.2s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.2s ease-out",
        // Glass animations
        "glass-shimmer": "glass-shimmer 3s ease-in-out infinite",
        "glass-float": "glass-float 3s ease-in-out infinite",
        "glass-glow": "glass-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
