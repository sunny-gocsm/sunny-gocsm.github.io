import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, existsSync } from "fs";
import { componentTagger } from "lovable-tagger";

// GitHub Pages serves the SPA as static files with no server-side rewrite, so a
// deep-link refresh (e.g. /today) would 404. Copying index.html -> 404.html makes
// Pages serve the app shell for any unknown path; react-router then renders it.
function spa404Fallback() {
  return {
    name: "spa-404-fallback",
    apply: "build" as const,
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const index = path.join(dist, "index.html");
      if (existsSync(index)) copyFileSync(index, path.join(dist, "404.html"));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Deployed to the org user-page https://sunny-gocsm.github.io/ — served at root.
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    spa404Fallback(),
  ].filter(Boolean),
  resolve: {
    alias: {
      // Self-contained imported onboarding feature (its own DS + shadcn ui).
      // Listed before "@" so "@onb/*" never falls through to the "@" alias.
      "@onb": path.resolve(__dirname, "./src/onboarding"),
      "@": path.resolve(__dirname, "./src"),
      // Consume the design system from source (workspace package) — full HMR, no build step.
      "@gocsm/design-system": path.resolve(__dirname, "../../packages/design-system/src"),
    },
  },
  build: {
    // The isolated `icons` chunk is ~810 kB: lucide-react v1.x's ESM entry re-exports
    // an `icons` namespace barrel that this Rollup can't tree-shake, so the full icon
    // set ships regardless of how few we import. It's isolated + long-cached here;
    // a real fix (deep per-icon imports / pinning lucide) is tracked as a follow-up.
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        // Split out only the big LEAF libraries (nothing else depends on them) so app
        // edits don't re-download them and they cache forever. Splitting non-leaves
        // (react, radix, …) creates vendor<->chunk cycles — vaul→radix, react-dom→…,
        // day-picker→date-fns — so everything else stays in one acyclic `vendor` chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("/d3-") || id.includes("victory-vendor")) return "charts";
          if (id.includes("lucide-react")) return "icons";
          return "vendor";
        },
      },
    },
  },
}));
