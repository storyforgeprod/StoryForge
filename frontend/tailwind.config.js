import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        // Editorial-only extras (no shadcn equivalent)
        elev: 'var(--elev)',
        elev2: 'var(--elev2)',
        bd2: 'var(--bd2)',
        mut2: 'var(--mut2)',
        acc2: 'var(--acc2)',
        'acc-soft': 'var(--acc-soft)',
        'acc-bd': 'var(--acc-bd)',
        'on-acc': 'var(--on-acc)',
      },
      fontFamily: {
        head: ['var(--font-head)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        xl: '16px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        eq: {
          '0%, 100%': { height: '25%' },
          '50%': { height: '95%' },
        },
        'dot-bounce': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(-5px)', opacity: '1' },
        },
        'dot-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        eq: 'eq 0.8s ease-in-out infinite',
        'dot-bounce': 'dot-bounce 1s infinite',
        'dot-pulse': 'dot-pulse 1s infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
