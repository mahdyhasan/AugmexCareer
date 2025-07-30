import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import JobDetail from "@/pages/job-detail";
import Apply from "@/pages/apply";
import Settings from "@/pages/settings";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { user, isAdmin } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Jobs} />
      <Route path="/login" component={Login} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:slug" component={JobDetail} />
      <Route path="/apply/:slug" component={Apply} />
      
      {/* Admin routes - always available */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/applications" component={Dashboard} />
      <Route path="/candidates" component={Dashboard} />
      <Route path="/ai-screening" component={Dashboard} />
      <Route path="/analytics" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
