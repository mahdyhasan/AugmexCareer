import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Briefcase, 
  FileText, 
  Users, 
  Bot, 
  TrendingUp, 
  Settings,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Job Management", href: "/job-management", icon: Briefcase },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Candidates", href: "/candidates", icon: Users },
  { name: "AI Screening", href: "/ai-screening", icon: Bot },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full overflow-y-auto pt-16">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <Link href="/create-job">
            <Button className="w-full bg-accent text-white hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Create Job Post
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
