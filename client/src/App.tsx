import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import Withdrawals from "@/pages/withdrawals";
import Settings from "@/pages/settings";

// Router component - No authentication required
function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/users" component={Users} />
      <Route path="/withdrawals" component={Withdrawals} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
