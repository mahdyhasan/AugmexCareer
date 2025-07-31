import { default as React } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  BarChart3, 
  Briefcase, 
  Building, 
  Calendar, 
  FileText, 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  Users,
  User,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["admin", "hr", "recruiter"] },
  { name: "Jobs", href: "/job-management", icon: Briefcase, roles: ["admin", "hr", "recruiter"] },
  { name: "Applications", href: "/applications", icon: FileText, roles: ["admin", "hr", "recruiter"] },
  { name: "Candidates", href: "/candidates", icon: Users, roles: ["admin", "hr", "recruiter"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin", "hr"] },
  { name: "User Management", href: "/users", icon: Shield, roles: ["admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin", "hr", "recruiter"] },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: () => {
      logout();
      window.location.href = '/login';
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Building className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Augmex</h1>
          <p className="text-xs text-gray-500">Job Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${mobile ? 'text-base py-3' : ''}`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || user?.email}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full"
        >
          <LogOut className="h-3 w-3 mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );

  if (!user) {
    return <div>{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Augmex</span>
          </div>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}