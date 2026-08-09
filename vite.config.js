import { defineConfig } from "vite";
import { copyFileSync, mkdirSync, cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import express from "express";
import multer from "multer";
import bodyParser from "body-parser";

// The store uses intentional classic (non-module) scripts so the global
// STORE_CONFIG pattern works when index.html is opened directly via file://.
// Vite only bundles module scripts, so we copy the loose files to dist/ here.
function copyStatic() {
  return {
    name: "copy-static-assets",
    writeBundle() {
      copyFileSync("store-config.js", "dist/store-config.js");
      copyFileSync("app.js", "dist/app.js");
      copyFileSync("admin.html", "dist/admin.html");
      copyFileSync("admin.js", "dist/admin.js");
      copyFileSync("admin.css", "dist/admin.css");
      copyFileSync("login.html", "dist/login.html");
      copyFileSync("login.js", "dist/login.js");
      copyFileSync("firebase-service.js", "dist/firebase-service.js");
      copyFileSync("firebase-config.js", "dist/firebase-config.js");
      if (existsSync("products")) cpSync("products", "dist/products", { recursive: true });
      if (!existsSync("dist/assets")) mkdirSync("dist/assets", { recursive: true });
    },
  };
}

// Admin API Middleware
function adminApi() {
  return {
    name: "admin-api",
    configureServer(server) {
      const app = express();
      app.use(bodyParser.json());

      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, "products/");
        },
        filename: (req, file, cb) => {
          cb(null, Date.now() + "-" + file.originalname);
        },
      });
      const upload = multer({ storage });

      // Redirect /admin to /admin.html
      server.middlewares.use((req, res, next) => {
        if (req.url === "/admin" || req.url === "/admin/") {
          res.writeHead(302, { Location: "/admin.html" });
          res.end();
        } else {
          next();
        }
      });

      // GET current config
      server.middlewares.use("/api/config", (req, res) => {
        try {
          const content = readFileSync("store-config.js", "utf-8");
          // Extract the object from window.STORE_CONFIG = { ... };
          const match = content.match(/window\.STORE_CONFIG\s*=\s*([\s\S]*?);/);
          if (match) {
            // Using a simple eval-like approach or parsing.
            // Since it's a JS file, we can strip the variable assignment and parse it as JSON if it's clean,
            // or we can just send the string and let the client handle it.
            // Let's send the extracted object.
            const configStr = match[1].trim();
            // A bit risky but for this template it works: we'll use Function constructor to "parse" the JS object
            const config = new Function(`return ${configStr}`)();
            res.end(JSON.stringify(config));
          } else {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Could not find STORE_CONFIG" }));
          }
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      // POST save config
      server.middlewares.use("/api/save", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end();
        }

        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
          try {
            const newConfig = JSON.parse(body);
            const header = `/* =============================================================
 *  STORE_CONFIG  —  The ONLY file you edit to re-brand the store.
 *  Change the values below, save, and refresh. No build step.
 * ============================================================= */

// Assigned to window so it works both as a classic script (double-click index.html)
// and as an ES module (Vite dev server, which scopes \`const\` to the module).
window.STORE_CONFIG = `;

            const content = header + JSON.stringify(newConfig, null, 2) + ";\n";
            writeFileSync("store-config.js", content);
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });

      // POST upload image
      server.middlewares.use("/api/upload", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end();
        }

        // We use express-style handling here via a custom adapter if needed,
        // but for simplicity in Vite middleware, we'll use multer directly.
        upload.single("image")(req, res, (err) => {
          if (err) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: err.message }));
          }
          res.end(JSON.stringify({ url: `/products/${req.file.filename}` }));
        });
      });
    },
  };
}

export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  plugins: [copyStatic(), adminApi()],
});
