import { Switch, Route, useLocation, useRoute, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import Withdrawals from "@/pages/withdrawals";
import Settings from "@/pages/settings";
import { useAuth } from "./lib/auth";
import { useEffect } from "react";

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

// Router component
function Router() {
  const { isAuthenticated } = useAuth();
  const [isLoginRoute] = useRoute("/login");

  // Redirect from login page if already authenticated
  if (isAuthenticated && isLoginRoute) {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login}/>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/withdrawals" component={() => <ProtectedRoute component={Withdrawals} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { checkAuth } = useAuth();
  
  // Check authentication status when app loads
  useEffect(() => {
    checkAuth().catch(err => {
      console.error("Auth check failed:", err);
    });
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
