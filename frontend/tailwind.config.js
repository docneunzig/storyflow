/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode colors
        background: {
          DEFAULT: '#0F0F0F',
          light: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#1A1A1A',
          elevated: '#262626',
          light: '#F5F5F5',
          'elevated-light': '#FFFFFF',
        },
        border: {
          DEFAULT: '#333333',
          light: '#E5E5E5',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A3A3A3',
          'primary-light': '#171717',
          'secondary-light': '#525252',
        },
        accent: '#3B82F6',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        // Relationship colors
        relationship: {
          family: '#3B82F6',
          romantic: '#EF4444',
          conflict: '#F97316',
          alliance: '#22C55E',
          mentor: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
