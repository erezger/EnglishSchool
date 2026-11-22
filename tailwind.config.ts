import type { Config } from 'tailwindcss';

// Same theme extension the original page passed to the Tailwind CDN.
const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        hebrew: ['Rubik', 'sans-serif'],
        english: ['Nunito', 'sans-serif'],
      },
      animation: {
        pop: 'pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        shake: 'shake 0.4s ease-in-out',
        'coin-float': 'coinFloat 1.1s ease-out forwards',
        'bounce-soft': 'bounceSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.85)' },
          '50%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        coinFloat: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '1' },
          '60%': { transform: 'translateY(-42px) scale(1.15)', opacity: '1' },
          '100%': { transform: 'translateY(-70px) scale(0.95)', opacity: '0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
