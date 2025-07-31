import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  User, 
  Menu,
  ChevronDown,
  Globe,
  Building,
  MapPin
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import augmexLogo from "../../../attached_assets/augmex_logo_retina_1753883414771.png";

export function Header() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img 
                src={augmexLogo} 
                alt="Augmex" 
                className="h-8 w-auto"
              />
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-gray-900">Augmex</span>
                <span className="text-sm text-gray-500 ml-2">Careers</span>
              </div>
            </div>
          </Link>

          {/* Search Bar - Only on jobs page */}
          {location === "/" || location === "/jobs" ? (
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search jobs, skills, or locations..."
                  className="pl-10 pr-4 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {/* Company Info Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden lg:flex">
                  <Building className="h-4 w-4 mr-2" />
                  Company
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Globe className="h-4 w-4 mr-2" />
                  About Augmex
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Building className="h-4 w-4 mr-2" />
                  Our Culture
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MapPin className="h-4 w-4 mr-2" />
                  Locations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Apply for Suitable Role Button */}
            <Link href="/jobs">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                Apply For Suitable Role
              </Button>
            </Link>

            {/* User Menu - Admin/HR Access */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  Account
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/login">Admin Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Company</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/jobs">All Jobs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/login">Admin Login</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}