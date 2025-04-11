import http from "http";

/**
 * This script checks if the application is up and running
 * by making a request to the /api/health endpoint.
 * 
 * It will exit with code 0 if the app is healthy, or 1 if it's not.
 * This can be used by Render's health check system.
 */
function healthCheck() {
  const port = process.env.PORT || 5000;
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/health',
    method: 'GET',
    timeout: 2000 // 2 second timeout
  };

  const req = http.request(options, (res) => {
    const { statusCode } = res;
    
    if (statusCode === 200) {
      console.log("Health check passed!");
      process.exit(0);
    } else {
      console.error(`Health check failed with status: ${statusCode}`);
      process.exit(1);
    }
  });

  req.on('error', (error) => {
    console.error("Health check failed:", error);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error("Health check timed out");
    req.destroy();
    process.exit(1);
  });

  req.end();
}

healthCheck();