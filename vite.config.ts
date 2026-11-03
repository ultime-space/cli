import { defineConfig } from 'vite-plus'

/**
 * 包之间只依赖产物：测试不再把 `@ultime/core` alias 到源码。
 * 跑本包测试前先构建 core（`pnpm --filter @ultime/core build:lib`）。
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
