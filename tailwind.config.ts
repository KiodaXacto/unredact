import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Background scale ──────────────────────────────────────
        bg: {
          primary:   '#1A1A1A', // page background (dark)
          secondary: '#242424', // panels / cards
          tertiary:  '#2E2E2E', // nested elements
          redacted:  '#2A2A2A', // redacted word blocks
          elevated:  '#303030', // modals, drawers
        },
        // ── Text scale ────────────────────────────────────────────
        text: {
          primary:  '#F5F0E6', // revealed text (cream)
          secondary:'#C8C2B6', // secondary text
          muted:    '#8A8A8A', // stop words, punctuation, hints
          accent:   '#E6A817', // amber — buttons, focus rings, CTA
          inverse:  '#1A1A1A', // text on light backgrounds
        },
        // ── Accent / brand ────────────────────────────────────────
        amber: {
          '100': '#FEF3C7',
          '200': '#FDE68A',
          '300': '#FCD34D',
          '400': '#FBBF24',
          '500': '#F59E0B',
          '600': '#E6A817', // ← brand amber
          '700': '#B45309',
          '800': '#92400E',
          '900': '#78350F',
        },
        // ── POS (part-of-speech) colour tints ────────────────────
        pos: {
          noun:   { DEFAULT: '#3B82F6', light: '#EFF6FF' }, // blue
          verb:   { DEFAULT: '#22C55E', light: '#F0FDF4' }, // green
          number: { DEFAULT: '#A855F7', light: '#FAF5FF' }, // purple
          adj:    { DEFAULT: '#F97316', light: '#FFF7ED' }, // orange
        },
        // ── Difficulty badges ─────────────────────────────────────
        difficulty: {
          easy:       '#3B82F6', // 🔵 Straightforward
          medium:     '#EAB308', // 🟡 Challenging
          hard:       '#EF4444', // 🔴 Obscure
        },
        // ── Guess history row tints ───────────────────────────────
        guess: {
          title:  '#E6A817', // gold — solved the title
          reveal: '#22C55E', // green — revealed words
          miss:   '#4B4B4B', // muted — word not found
        },
        // ── Light theme overrides (applied via .light class) ──────
        light: {
          bg:       '#F8F6F1',
          panel:    '#EDEBE6',
          redacted: '#1A1A1A',
          text:     '#1A1A1A',
          muted:    '#6B6B6B',
        },
      },

      // ── Typography ───────────────────────────────────────────────
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.6rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
      },

      // ── Spacing ──────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ── Border radius ─────────────────────────────────────────────
      borderRadius: {
        'sm':  '0.25rem',
        DEFAULT: '0.375rem',
        'md':  '0.5rem',
        'lg':  '0.75rem',
        'xl':  '1rem',
        '2xl': '1.5rem',
      },

      // ── Box shadows ───────────────────────────────────────────────
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.25)',
        'modal': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'toast': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'amber': '0 0 0 2px rgba(230, 168, 23, 0.5)',
      },

      // ── Animations ────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'reveal': {
          '0%':   { backgroundColor: '#2A2A2A', color: 'transparent' },
          '50%':  { backgroundColor: '#E6A817', color: 'transparent' },
          '100%': { backgroundColor: 'transparent', color: '#F5F0E6' },
        },
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(230, 168, 23, 0)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(230, 168, 23, 0.3)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 200ms ease-out',
        'slide-up':   'slide-up 250ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
        'reveal':     'reveal 400ms ease-out forwards',
        'pulse-amber':'pulse-amber 2s ease-in-out infinite',
        'spin-slow':  'spin-slow 3s linear infinite',
      },

      // ── Transitions ───────────────────────────────────────────────
      transitionProperty: {
        'colors': 'color, background-color, border-color, fill, stroke',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
};

export default config;
