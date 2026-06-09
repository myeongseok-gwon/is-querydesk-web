import { defineConfig } from "vite";

// Relative base so the build works under a GitHub Pages project subpath
// (https://<user>.github.io/<repo>/). The big data files in public/data are
// copied to dist/data as-is and fetched at runtime.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2022",
  },
});
