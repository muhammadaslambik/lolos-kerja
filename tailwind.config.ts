import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: v("ink"),
        paper: v("paper"),
        surface: v("surface"),
        line: v("line"),
        brand: { DEFAULT: v("brand"), dark: v("brand-dark"), soft: v("brand-soft"), ink: v("brand-ink") },
        sun: { DEFAULT: v("sun"), soft: v("sun-soft") },
      },
      fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
