import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  test: {
    env: {
      TZ: "Asia/Tokyo",
    },
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
