import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        collect: path.resolve(__dirname, "collect.html"),
        pay: path.resolve(__dirname, "pay.html"),
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
