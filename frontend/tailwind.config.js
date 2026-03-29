/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-jetbrains-mono)'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        verified: 'var(--verified)',
        'verified-foreground': 'var(--verified-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        glass: 'var(--glass)',
        'glass-border': 'var(--glass-border)',
      },
      backgroundImage: {
        'grid-pattern': 'var(--grid-pattern)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
        heavy: '40px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 120, 255, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(0, 120, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
