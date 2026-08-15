import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Design tokens for InnovConcours — identité "dossier officiel"
        ink: {
          DEFAULT: "#12213B", // navy administratif, autorité
          light: "#1D3358",
          dark: "#0A1526",
        },
        paper: {
          DEFAULT: "#F2F3F6", // papier officiel, froid, pas chaud/creme
          dark: "#E6E8ED",
        },
        gold: {
          DEFAULT: "#C89B3C", // sceau, reussite, cachet dore
          light: "#E0C170",
          dark: "#9C7726",
        },
        seal: {
          DEFAULT: "#A13D3D", // rouge encre de tampon — accents rares, validation
          light: "#C25858",
        },
        validated: {
          DEFAULT: "#2F6F4F", // vert "admis"
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(18,33,59,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
export default config;
