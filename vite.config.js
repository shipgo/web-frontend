import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    // `.claude/worktrees/` son checkouts anidados de subagentes con su propio
    // `node_modules` (doble copia de React) — vitest los levanta y explota con
    // cientos de falsos negativos si no se excluyen.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.claude/**"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        credentials: "include",
      },
    },
  },
  resolve: {
    alias: [
      { find: "@components", replacement: "/src/app/components" },
      { find: "@config", replacement: "/src/app/config" },
      { find: "@constants", replacement: "/src/app/constants" },
      { find: "@contexts", replacement: "/src/app/contexts" },
      { find: "@hooks", replacement: "/src/app/hooks" },
      { find: "@providers", replacement: "/src/app/providers" },
      { find: "@utils", replacement: "/src/app/utils" },
      { find: "@domain", replacement: "/src/app/domain" },
      { find: "@features", replacement: "/src/features" },
      { find: "@api", replacement: "/src/app/api" },
      { find: "@stores", replacement: "/src/app/stores" },
    ],
  },
});
