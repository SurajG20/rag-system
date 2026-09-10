import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const api = "http://localhost:3000";
const longRunning = {
  target: api,
  changeOrigin: true,
  timeout: 0,
  proxyTimeout: 0,
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/scan": longRunning,
      "/health": { target: api, changeOrigin: true },
      "/kb": longRunning,
    },
  },
});
