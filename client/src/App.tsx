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
import GeneralApply from "@/pages/general-apply";
import Settings from "@/pages/settings";
import UserManagement from "@/pages/user-management";
import Reports from "@/pages/reports";
import JobManagement from "@/pages/job-management";
import ApplicationsManagement from "@/pages/applications-management";
import CreateJob from "@/pages/create-job";
import EditJob from "@/pages/edit-job";
import JobApplications from "@/pages/job-applications";
import { useAuth } from "@/hooks/useAuth";

// Protected Route Component
function ProtectedRoute({ component: Component, requiredRole }: { component: any, requiredRole?: string }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  if (requiredRole && !['admin', 'hr'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Jobs} />
      <Route path="/login" component={Login} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:slug" component={JobDetail} />
      <Route path="/apply/:slug" component={Apply} />
      <Route path="/general-apply" component={GeneralApply} />
      
      {/* Protected admin routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} requiredRole="admin" />
      </Route>
      <Route path="/job-management">
        <ProtectedRoute component={JobManagement} requiredRole="admin" />
      </Route>
      <Route path="/create-job">
        <ProtectedRoute component={CreateJob} requiredRole="admin" />
      </Route>
      <Route path="/edit-job/:id">
        <ProtectedRoute component={EditJob} requiredRole="admin" />
      </Route>
      <Route path="/applications">
        <ProtectedRoute component={ApplicationsManagement} requiredRole="admin" />
      </Route>
      <Route path="/candidates">
        <ProtectedRoute component={ApplicationsManagement} requiredRole="admin" />
      </Route>
      <Route path="/ai-screening">
        <ProtectedRoute component={ApplicationsManagement} requiredRole="admin" />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Reports} requiredRole="admin" />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UserManagement} requiredRole="admin" />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} requiredRole="admin" />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} requiredRole="admin" />
      </Route>
      <Route path="/job-applications/:jobId">
        <ProtectedRoute component={JobApplications} requiredRole="admin" />
      </Route>
      
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
