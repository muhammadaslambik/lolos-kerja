import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16222E",
        paper: "#F6F7F4",
        brand: { DEFAULT: "#0E5A66", dark: "#0A424B", soft: "#DCEBEC" },
        sun: { DEFAULT: "#F2B33D", soft: "#FBEBC8" },
        line: "#DDE2DD",
      },
      fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
