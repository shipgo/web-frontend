import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@constants', replacement: '/src/constants' },
      { find: '@utils', replacement: '/src/utils' },
      { find: '@layout', replacement: '/src/layout' },
      { find: '@components', replacement: '/src/components' },
      { find: '@pages', replacement: '/src/pages' },
      { find: '@hooks', replacement: '/src/hooks' },
      { find: '@contexts', replacement: '/src/contexts' },
      { find: '@providers', replacement: '/src/providers' },
      { find: '@config', replacement: '/src/config' },
      { find: '@routes', replacement: '/src/routes' },
    ]
  },
})
