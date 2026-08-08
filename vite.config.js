import { defineConfig } from "vite";
import { copyFileSync, mkdirSync, cpSync, existsSync } from "node:fs";

// The store uses intentional classic (non-module) scripts so the global
// STORE_CONFIG pattern works when index.html is opened directly via file://.
// Vite only bundles module scripts, so we copy the loose files to dist/ here.
function copyStatic() {
  return {
    name: "copy-static-assets",
    writeBundle() {
      copyFileSync("store-config.js", "dist/store-config.js");
      copyFileSync("app.js", "dist/app.js");
      if (existsSync("products")) cpSync("products", "dist/products", { recursive: true });
      if (!existsSync("dist/assets")) mkdirSync("dist/assets", { recursive: true });
    },
  };
}

export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  plugins: [copyStatic()],
});
