/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      primary: "#FF1313",
      secondary: "#83868F",
      dark: "#020605",
      light: "#EAE2E5",
      white: "#ffffff",
      gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
      },
      green: {
        100: "#dcfce7",
        800: "#166534",
      },
      red: {
        100: "#fee2e2",
        600: "#dc2626",
        800: "#991b1b",
      },
      blue: {
        600: "#2563eb",
        700: "#1d4ed8",
      },
      transparent: "transparent",
    },
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      serif: ["Instrument Serif", "Georgia", "serif"],
    },
  },
  plugins: [],
}
