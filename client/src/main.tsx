import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { useAuth } from "./lib/auth";

// Check authentication on startup
if (typeof window !== 'undefined') {
  useAuth.getState().checkAuth().catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);
