import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "client",
  envDir: process.cwd(),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5174"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
