import type { Config } from "tailwindcss";

export default {
  darkMode:'class', 
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/Component/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand colors for MogShop
        mog: {
          DEFAULT: '#0f4c81', // brand blue
          50: '#f2f7fb',
          100: '#e6f0fa',
          200: '#bfdff4',
          300: '#99cfea',
          400: '#4da9da',
          500: '#0f4c81',
          600: '#0e4373',
          700: '#0b365a',
          800: '#093048',
          900: '#05202f',
        },
        mogorange: {
          DEFAULT: '#f59e0b',
          50: '#fff8ec',
          100: '#fff2d9',
          200: '#ffe3a8',
          300: '#ffd579',
          400: '#ffc04a',
          500: '#f59e0b',
          600: '#d08509',
          700: '#a36507',
          800: '#7b4805',
          900: '#512f03',
        },
        mogwhite: '#ffffff',
      },
    },
  },
  plugins: [],
} satisfies Config;


 