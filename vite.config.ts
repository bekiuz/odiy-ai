import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages serves this project under /odiy-ai/.
  // Keep the root path for Netlify and local development.
  base: process.env.GITHUB_PAGES === "true" ? "/odiy-ai/" : "/",
  plugins: [react()],
});
