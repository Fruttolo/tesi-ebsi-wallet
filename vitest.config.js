import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import nobleHashesPlugin from "./vite-plugin-noble-hashes.js";

export default defineConfig({
  plugins: [react(), nobleHashesPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/tests/",
        "**/*.config.js",
        "**/*.config.ts",
        "dist/",
        "build/",
        "android/",
      ],
      include: ["src/**/*.{js,jsx}"],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
    server: {
      deps: {
        inline: ["@noble/hashes"],
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      buffer: "buffer",
      "@noble/hashes/pbkdf2": "@noble/hashes/pbkdf2.js",
      "@noble/hashes/sha256": "@noble/hashes/sha256.js",
      "@noble/hashes/utils": "@noble/hashes/utils.js",
    },
  },
  optimizeDeps: {
    include: ["@noble/hashes/pbkdf2", "@noble/hashes/sha256", "@noble/hashes/utils"],
  },
  define: {
    global: "globalThis",
  },
});
