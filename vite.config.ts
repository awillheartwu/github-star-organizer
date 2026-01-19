import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/api/**/*.ts',
        'src/queries/**/*.ts',
        'src/components/projects/**/*.vue',
        'src/views/projects/**/*ListView.vue',
        'src/views/tags/**/*ListView.vue',
      ],
      thresholds: {
        statements: 60,
        lines: 60,
        branches: 55,
        functions: 55,
      },
    },
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
