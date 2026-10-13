import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Segoe UI", "Tahoma", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "1.5rem",
        pill: "9999px",
      },
      boxShadow: {
        soft: "0 8px 30px rgb(15 17 40 / 0.07)",
        float: "0 20px 60px rgb(40 32 140 / 0.18)",
        glow: "0 10px 30px rgb(108 99 255 / 0.35)",
      },
      colors: {
        brand: {
          primary: token("--c-primary"),
          deep: token("--c-primary-deep"),
          accent: token("--c-accent"),
        },
        surface: {
          DEFAULT: token("--c-surface"),
          raised: token("--c-raised"),
          overlay: token("--c-overlay"),
        },
        text: {
          DEFAULT: token("--c-text"),
          muted: token("--c-muted"),
        },
        border: token("--c-border"),
        state: {
          idle: token("--c-idle"),
          progress: token("--c-progress"),
          done: token("--c-done"),
          danger: token("--c-danger"),
        },
      },
    },
  },
  plugins: [],
};

export default config;
