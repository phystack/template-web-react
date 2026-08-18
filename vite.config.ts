import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative paths (./) so the bundle works from any hosting prefix — deploys
// publishes it under `{urlId}/` on the web endpoints CDN.
const base = process.env.PUBLIC_URL || process.env.VITE_ROOT_PATH || "./";

export default defineConfig({
  base,
  plugins: [react()],
  define: {
    // Polyfill Node.js globals for isomorphic packages like @phystack/hub-client
    "process.env": {},
    "process.version": JSON.stringify(""),
    "process.platform": JSON.stringify("browser"),
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      events: "events",
    },
  },
  build: {
    outDir: "build",
    target: "es2015",
    sourcemap: false,
    // @phystack/hub-client ships CJS; when it resolves via a workspace symlink
    // (monorepo dev) rollup skips the default /node_modules/ commonjs pass and
    // named imports break — include it explicitly. Harmless once the package
    // comes from the registry.
    commonjsOptions: {
      include: [/hub-client/, /node_modules/],
    },
    rollupOptions: {
      output: {
        entryFileNames: "static/js/[name].[hash].js",
        chunkFileNames: "static/js/[name].[hash].js",
        assetFileNames: "static/[ext]/[name].[hash].[ext]",
      },
    },
  },
  optimizeDeps: {
    include: ["events", "@phystack/hub-client"],
  },
  json: {
    stringify: false,
  },
});
