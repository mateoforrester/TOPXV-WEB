import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bordo: { DEFAULT: '#6B1C28', dark: '#2B0A10', deep: '#5A0F1C', light: '#8B0000' },
        oro: { DEFAULT: '#d4af37', bright: '#FFD700' },
        azul: { DEFAULT: '#1E3A8A', slate: '#3f4b6d', real: '#0000CD' },
        cancha: '#3A8E00',
        cream: '#F8F6F4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
