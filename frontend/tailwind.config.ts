import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        equb: {
          background: "#F6F3EC",
          primary: "#5A4BDB",
          text: "#1F1B3A",
        },
      },
      borderRadius: {
        DEFAULT: "16px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Inter Tight", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
