import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Required in Docker — binds to all interfaces
    port: 5173,
    watch: {
      // On Docker Desktop (macOS/Windows): virtualization layer breaks inotify.
      // usePolling: true polls the filesystem directly. Guarantees HMR at the
      // cost of CPU. On native Linux Docker, set this to false.
      usePolling: true,
      interval: 100,
    },
    proxy: {
      "/api": {
        target: "http://api:3000", // 'api' = Docker internal DNS
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: {
      // Direct alias to TS source — no dist/ needed in development
      "@myapp/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
