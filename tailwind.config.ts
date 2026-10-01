import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Paleta de marca JUNTOS
        'juntos-blue': {
          DEFAULT: '#0E3A5D',
          600: '#1E40AF',
          50: '#EFF6FF',
        },
        'juntos-green': {
          DEFAULT: '#10B981',
          600: '#059669',
          50: '#ECFDF5',
        },
        primary: { DEFAULT: '#0E3A5D', foreground: '#F8FAFC' },
        secondary: { DEFAULT: '#10B981', foreground: '#F8FAFC' },
        destructive: { DEFAULT: '#DC2626', foreground: '#F8FAFC' },
        muted: { DEFAULT: '#F1F5F9', foreground: '#64748B' },
        accent: { DEFAULT: '#ECFDF5', foreground: '#059669' },
        card: { DEFAULT: '#FFFFFF', foreground: '#0F172A' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
