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
import UserManagement from "@/pages/user-management";
import Reports from "@/pages/reports";
import JobManagement from "@/pages/job-management";
import ApplicationsManagement from "@/pages/applications-management";
import CreateJob from "@/pages/create-job";
import EditJob from "@/pages/edit-job";
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
      <Route path="/job-management" component={JobManagement} />
      <Route path="/create-job" component={CreateJob} />
      <Route path="/edit-job/:id" component={EditJob} />
      <Route path="/applications" component={ApplicationsManagement} />
      <Route path="/candidates" component={ApplicationsManagement} />
      <Route path="/ai-screening" component={ApplicationsManagement} />
      <Route path="/analytics" component={Dashboard} />
      <Route path="/users" component={UserManagement} />
      <Route path="/settings" component={Settings} />
      <Route path="/reports" component={Reports} />
      
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
