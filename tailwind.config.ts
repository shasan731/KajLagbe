import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9f1",
          100: "#d4f0db",
          200: "#a6e1b8",
          300: "#6fcd8d",
          400: "#3eb96a",
          500: "#1f9b50",
          600: "#137b3f",
          700: "#0f6234",
          800: "#0d4e2c",
          900: "#0a3f25",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
