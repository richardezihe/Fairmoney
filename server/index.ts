import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Set a timeout to catch issues where the server doesn't initialize
const SERVER_TIMEOUT = 60000; // 60 seconds
const serverInitializationTimeout = setTimeout(() => {
  console.error("SERVER INITIALIZATION TIMEOUT: The server failed to initialize within", SERVER_TIMEOUT/1000, "seconds");
  console.error("Forcing server to listen on port 5000...");
  
  const app = express();
  const server = require('http').createServer(app);
  
  app.get('/', (req, res) => {
    res.send('Server running in emergency fallback mode. Normal functionality may be limited.');
  });
  
  server.listen({
    port: 5000,
    host: "0.0.0.0",
    reusePort: true,
    ipv6Only: false,
  }, () => {
    console.log('Emergency fallback server listening on port 5000');
  });
}, SERVER_TIMEOUT);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  console.log("Starting server initialization...");
  
  try {
    console.log("Registering routes...");
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Error middleware caught:", err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("Setting up Vite for development...");
      await setupVite(app, server);
      console.log("Vite setup complete");
    } else {
      console.log("Setting up static serving for production...");
      serveStatic(app);
      console.log("Static serving setup complete");
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    console.log(`Starting server on port ${port}...`);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      // Clear the timeout as we've successfully started the server
      clearTimeout(serverInitializationTimeout);
    });
  } catch (error) {
    console.error("Error during server initialization:", error);
  }
})();
