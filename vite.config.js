import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@components", replacement: "/src/app/components" },
      { find: "@config", replacement: "/src/app/config" },
      { find: "@constants", replacement: "/src/app/constants" },
      { find: "@contexts", replacement: "/src/app/contexts" },
      { find: "@hooks", replacement: "/src/app/hooks" },
      { find: "@providers", replacement: "/src/app/providers" },
      { find: "@utils", replacement: "/src/app/utils" },
      { find: "@features", replacement: "/src/features" },
    ],
  },
});
