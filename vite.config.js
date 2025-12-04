import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import inject from "@rollup/plugin-inject";

export default defineConfig({
  plugins: [
    react(),

    // Polyfill SOLO per Buffer
    inject({
      Buffer: ["buffer", "Buffer"],
    }),
  ],

  resolve: {
    alias: {
      buffer: "buffer",
    },
  },

  define: {
    global: "globalThis",
  }
});
