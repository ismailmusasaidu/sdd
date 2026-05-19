/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary: Danhausa dark forest green (from flyer)
        primary: {
          50:  '#f0f7f4',
          100: '#d6ece2',
          200: '#aed9c5',
          300: '#7ec0a4',
          400: '#4fa382',
          500: '#2d8a65',
          600: '#1e6e4f',
          700: '#155239',
          800: '#0f3d2c',
          900: '#092a1e',
        },
        // Secondary: Danhausa orange (from flyer)
        secondary: {
          50:  '#fff5ed',
          100: '#ffe6d0',
          200: '#ffc99a',
          300: '#ffa55e',
          400: '#ff8530',
          500: '#e8721c',
          600: '#c45a10',
          700: '#9e440b',
          800: '#7a3209',
          900: '#552208',
        },
        // Accent: warm amber for highlights
        accent: {
          50:  '#fffbf0',
          100: '#fff3d0',
          200: '#ffe599',
          300: '#ffd55c',
          400: '#ffc520',
          500: '#f5b000',
          600: '#d49500',
          700: '#a87500',
          800: '#7d5800',
          900: '#533a00',
        },
        neutral: {
          50:  '#f8f9fa',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      backgroundImage: {
        'gradient-primary':      'linear-gradient(135deg, #1e6e4f 0%, #092a1e 100%)',
        'gradient-secondary':    'linear-gradient(135deg, #e8721c 0%, #c45a10 100%)',
        'gradient-hero':         'linear-gradient(135deg, #0f3d2c 0%, #1e6e4f 60%, #2d8a65 100%)',
        'gradient-warm':         'linear-gradient(135deg, #e8721c 0%, #f5b000 100%)',
        'gradient-dark':         'linear-gradient(135deg, #092a1e 0%, #0f3d2c 100%)',
        'gradient-green-orange': 'linear-gradient(135deg, #1e6e4f 0%, #e8721c 100%)',
      },
      boxShadow: {
        'glow-primary':   '0 0 24px rgba(30, 110, 79, 0.35)',
        'glow-secondary': '0 0 24px rgba(232, 114, 28, 0.35)',
        'elevation-1':    '0 2px 8px rgba(0, 0, 0, 0.07)',
        'elevation-2':    '0 4px 16px rgba(0, 0, 0, 0.11)',
        'elevation-3':    '0 8px 28px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in':      'fadeIn 0.6s ease-in-out',
        'slide-up':     'slideUp 0.6s ease-out',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};
