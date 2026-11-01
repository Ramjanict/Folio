/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1915",
        paper: "#f3efe6",
        card: "#fffdf8",
        line: "#e4dcd0",
        mute: "#6f675c",
        pine: {
          DEFAULT: "#0f6e56",
          dark: "#0c5946",
          soft: "#e5f3ed",
        },
        clay: "#9d2c2c",
        gold: "#9a6700",
      },
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 25, 21, 0.04), 0 12px 32px rgba(28, 25, 21, 0.06)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        menu: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.5s ease both",
        fade: "fade 0.35s ease both",
        menu: "menu 0.22s ease both",
      },
    },
  },
  plugins: [],
};
