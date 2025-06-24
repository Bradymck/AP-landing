// server/index.ts
import express2 from "express";

// server/routes.ts
function registerRoutes(app2) {
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import checker from "vite-plugin-checker";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    checker({ typescript: true, overlay: false }),
    runtimeErrorOverlay(),
    themePlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@db": path.resolve(__dirname, "db")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
async function setupVite(app2, server) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
import { createServer } from "http";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import { dirname as dirname3 } from "path";
import fs2 from "fs";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = dirname3(__filename3);
function log(message) {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [express] ${message}`);
}
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  registerRoutes(app);
  const server = createServer(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const PORT = process.env.PORT || (app.get("env") === "development" ? 5e3 : 5001);
  const HOST = process.env.HOST || "0.0.0.0";
  if (app.get("env") === "production") {
    const publicPath = path3.resolve(process.cwd(), "dist", "public");
    try {
      if (!fs2.existsSync(publicPath)) {
        log(`Error: Static files directory not found at ${publicPath}. Please run 'npm run build' first.`);
        process.exit(1);
      }
      const files = fs2.readdirSync(publicPath);
      log(`Available files in ${publicPath}:`);
      files.forEach((file) => log(`- ${file}`));
      app.use((_req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        next();
      });
      app.use(express2.static(publicPath, {
        etag: true,
        lastModified: true,
        index: false,
        // Disable automatic directory indexing
        setHeaders: (res, filepath) => {
          if (filepath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          } else if (filepath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$/)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        }
      }));
      app.use("/api", (req, res, next) => {
        if (req.path.startsWith("/api/")) {
          next();
        } else {
          res.status(404).json({ message: "API endpoint not found" });
        }
      });
      app.get("*", (req, res) => {
        try {
          const indexPath = path3.join(publicPath, "index.html");
          if (!fs2.existsSync(indexPath)) {
            throw new Error("index.html not found");
          }
          res.sendFile(indexPath);
        } catch (error) {
          log(`Error serving index.html: ${error}`);
          res.status(500).send("Internal Server Error");
        }
      });
      log(`Static files are being served from: ${publicPath}`);
    } catch (error) {
      log(`Fatal error setting up static file serving: ${error}`);
      process.exit(1);
    }
  }
  if (app.get("env") === "development") {
    await setupVite(app, server);
  }
  server.listen({
    port: Number(PORT),
    host: HOST
  }, () => {
    log(`Server running on ${HOST}:${PORT} in ${app.get("env")} mode`);
  });
})();
