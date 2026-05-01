import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191919",
        paper: "#ffffff",
        soft: "#f7f6f3",
        rule: "#e9e9e7",
        muted: "#787774",
        // Notion brand color palette
        notion: {
          blue: "#0b6e99",
          "blue-soft": "#ddebf1",
          green: "#0f7b6c",
          "green-soft": "#ddedea",
          orange: "#d9730d",
          "orange-soft": "#faebdd",
          purple: "#6940a5",
          "purple-soft": "#eae4f2",
          pink: "#ad1a72",
          "pink-soft": "#f4dfeb",
          red: "#e03e3e",
          "red-soft": "#fbe4e4",
          yellow: "#dfab01",
          "yellow-soft": "#fbf3db",
          brown: "#64473a",
          "brown-soft": "#e9e5e3",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "-apple-system", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
