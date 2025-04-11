import fetch from "node-fetch";

/**
 * This script checks if the application is up and running
 * by making a request to the /api/health endpoint.
 * 
 * It will exit with code 0 if the app is healthy, or 1 if it's not.
 * This can be used by Render's health check system.
 */
async function healthCheck() {
  try {
    const port = process.env.PORT || 5000;
    const response = await fetch(`http://localhost:${port}/api/health`);
    
    if (response.ok) {
      console.log("Health check passed!");
      process.exit(0);
    } else {
      console.error(`Health check failed with status: ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Health check failed:", error);
    process.exit(1);
  }
}

healthCheck();