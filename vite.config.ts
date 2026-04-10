import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiTarget = env.VITE_API_URL || env.REACT_APP_API_URL || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      include: [
        'axios',
        'react',
        'react-dom',
        'react-router-dom',
        '@reduxjs/toolkit',
        'react-redux',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'lucide-react',
        'recharts',
        'motion/react',
      ],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      warmup: {
        clientFiles: [
          './src/main.tsx',
          './src/app/App.tsx',
          './src/features/auth/pages/LoginPage.tsx',
          './src/features/dashboard/pages/DashboardRouter.tsx',
          './src/features/dashboard/pages/UserDashboard.tsx',
        ],
      },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      },
    },
  };
});
