import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bnlv: {
          navy: '#0B1E3E',
          gold: '#C9A84C',
          cream: '#F5F0E8',
        },
      },
    },
  },
  plugins: [],
};
export default config;