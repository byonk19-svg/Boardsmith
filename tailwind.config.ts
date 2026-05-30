import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2520",
        bark: "#72533b",
        moss: "#48634f",
        shop: "#f7f4ef",
        sawdust: "#e8dccb",
        caution: "#a34d12",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(31, 37, 32, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
