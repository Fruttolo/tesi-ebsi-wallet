import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import inject from "@rollup/plugin-inject";
import { visualizer } from "rollup-plugin-visualizer";
import javascriptObfuscator from "rollup-plugin-javascript-obfuscator";
import nobleHashesPlugin from "./vite-plugin-noble-hashes.js";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    nobleHashesPlugin(),

    // Polyfill SOLO per Buffer
    inject({
      Buffer: ["buffer", "Buffer"],
    }),

    // JavaScript Obfuscation (solo in produzione)
    mode === "production" &&
      javascriptObfuscator({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: false, // Può causare problemi con alcuni debugger
        disableConsoleOutput: true,
        identifierNamesGenerator: "hexadecimal",
        log: false,
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
        stringArrayEncoding: ["base64"],
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
      }),

    // Bundle analyzer (only in analyze mode)
    mode === "analyze" &&
      visualizer({
        open: true,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  resolve: {
    alias: {
      buffer: "buffer",
    },
  },

  optimizeDeps: {
    include: ["@noble/hashes/pbkdf2.js", "@noble/hashes/sha2.js", "@noble/hashes/utils.js"],
  },

  define: {
    global: "globalThis",
  },

  server: {
    host: "0.0.0.0", // Consenti connessioni da qualsiasi interfaccia di rete
    port: 5173,
    strictPort: true,
  },

  build: {
    // Minification settings
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: true,
        pure_funcs: mode === "production" ? ["console.log", "console.debug"] : [],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    // Source maps solo in dev
    sourcemap: mode !== "production",
  },
}));
