/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ink': 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        'bg': 'var(--bg)',
        'bg-secondary': 'var(--bg-secondary)',
        'border': 'var(--border)',
        'accent': 'var(--accent)',
        'accent-light': 'var(--accent-light)',
      },
      borderRadius: {
        'radius': 'var(--radius, 8px)',
      },
      spacing: {
        'spacing': 'var(--spacing, 1rem)',
      },
    },
  },
  plugins: [],
}
