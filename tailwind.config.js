/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        terminal: 'var(--color-terminal)',
        relay: 'var(--color-relay)',
        active: 'var(--color-active)',
        visited: 'var(--color-visited)',
        inTree: 'var(--color-in-tree)',
        consider: 'var(--color-consider)',
        reject: 'var(--color-reject)',
      },
    },
  },
  plugins: [],
}

