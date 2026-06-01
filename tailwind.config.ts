
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Font Pairing: 'Literata' for headlines, 'Inter' for body
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Literata', 'serif'], // Use serif for headline font
        code: ['monospace'],
      },
      // Color Scheme: Deep Indigo, Desaturated Parchment, Muted Gold
      colors: {
        background: 'hsl(30 29% 94%)', // Desaturated Parchment
        foreground: 'hsl(220 7% 12%)', // Darker text for readability
        card: {
          DEFAULT: 'hsl(30 29% 98%)', // Lighter parchment for cards
          foreground: 'hsl(220 7% 12%)',
        },
        popover: {
          DEFAULT: 'hsl(30 29% 98%)',
          foreground: 'hsl(220 7% 12%)',
        },
        primary: {
          DEFAULT: 'hsl(244 47% 20%)', // Deep Indigo
          foreground: 'hsl(30 100% 98%)', // Light text on primary
        },
        secondary: {
          DEFAULT: 'hsl(40 58% 92%)', // Lighter parchment/cream
          foreground: 'hsl(220 7% 12%)',
        },
        muted: {
          DEFAULT: 'hsl(30 29% 96%)', // Slightly off-white/parchment-like
          foreground: 'hsl(220 7% 30%)', // Muted text color
        },
        accent: {
          DEFAULT: 'hsl(40 68% 62%)', // Muted Gold
          foreground: 'hsl(30 100% 10%)', // Dark text on accent
        },
        destructive: {
          DEFAULT: 'hsl(10 80% 50%)',
          foreground: 'hsl(0 0% 98%)',
        },
        border: 'hsl(30 29% 85%)', // Subtle border color
        input: 'hsl(30 29% 85%)',
        ring: 'hsl(244 47% 20%)', // Deep Indigo for rings
        chart: {
          '1': 'hsl(12 76% 61%)',
          '2': 'hsl(173 58% 39%)',
          '3': 'hsl(197 37% 24%)',
          '4': 'hsl(43 74% 66%)',
          '5': 'hsl(27 87% 67%)',
        },
        // Sidebar colors are derived from the theme, but can be customized further if needed
        sidebar: {
          DEFAULT: 'hsl(30 29% 98%)', // Light parchment for sidebar background
          foreground: 'hsl(220 7% 12%)', // Dark text for sidebar foreground
          primary: 'hsl(244 47% 20%)', // Deep Indigo for sidebar primary actions
          'primary-foreground': 'hsl(30 100% 98%)', // Light text on primary
          accent: 'hsl(40 68% 62%)', // Muted Gold for sidebar accents
          'accent-foreground': 'hsl(30 100% 10%)', // Dark text on accent
          border: 'hsl(30 29% 85%)', // Subtle border for sidebar elements
          ring: 'hsl(244 47% 20%)', // Deep Indigo for sidebar rings
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
