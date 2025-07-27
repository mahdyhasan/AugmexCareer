import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-16">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-screen pt-16">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
