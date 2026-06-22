import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Production GoCSM web app. Consumes @gocsm/design-system from source (workspace
// package) via the same alias the prototype uses — edit the DS, this hot-reloads.
export default defineConfig({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@gocsm/design-system": path.resolve(__dirname, "../../packages/design-system/src"),
    },
  },
});
