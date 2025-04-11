import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

async function startServer() {
  console.log("Starting server initialization...");

  try {
    console.log("Registering routes...");
    const server = createServer(app);
    await registerRoutes(app);
    console.log("Routes registered successfully");

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Error middleware caught:", err);
      res.status(status).json({ message });
    });

    // Setup Vite in development or static serving in production
    if (app.get("env") === "development") {
      console.log("Setting up Vite for development...");
      await setupVite(app, server);
      console.log("Vite setup complete");
    } else {
      console.log("Setting up static serving for production...");
      serveStatic(app);
      console.log("Static serving setup complete");
    }

    const port = process.env.PORT || 5000;
    console.log(`Starting server on port ${port}...`);

    return new Promise((resolve, reject) => {
      server.listen({
        port,
        host: "0.0.0.0",
        ipv6Only: false,
      }, () => {
        log(`Server running on port ${port}`);
        resolve(server);
      }).on('error', (error) => {
        console.error('Server error:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error during server initialization:", error);
    throw error;
  }
}

startServer().catch(error => {
  console.error("Fatal server error:", error);
  process.exit(1);
});