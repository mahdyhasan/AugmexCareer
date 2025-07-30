import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, MapPin, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { JobCard } from "@/components/JobCard";
import { Job } from "@/types";
import { Link } from "wouter";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    employmentType: "",
    experienceLevel: "",
    remoteType: "",
  });

  const { data: jobsData, isLoading } = useQuery<{ jobs: Job[] }>({
    queryKey: ["/api/jobs", { 
      status: "active",
      search: searchTerm || undefined,
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
    }],
  });

  const { data: categoriesData } = useQuery<{ categories: any[] }>({
    queryKey: ["/api/categories"],
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? "" : value,
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      employmentType: "",
      experienceLevel: "",
      remoteType: "",
    });
  };

  const jobs = jobsData?.jobs || [];
  const categories = categoriesData?.categories || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img src="/augmex_logo_retina_1753883414771.png" alt="Augmex" className="h-12 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              Careers at Augmex
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Join our team of innovators and build the future of technology solutions
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search jobs by title, skills, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filter Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.employmentType}
                onValueChange={(value) => handleFilterChange("employmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Employment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.experienceLevel}
                onValueChange={(value) => handleFilterChange("experienceLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Experience Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.remoteType}
                onValueChange={(value) => handleFilterChange("remoteType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Work Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Categories */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">
                      {category.icon === 'code' && '💻'}
                      {category.icon === 'palette' && '🎨'}
                      {category.icon === 'product' && '📱'}
                      {category.icon === 'megaphone' && '📢'}
                      {category.icon === 'handshake' && '🤝'}
                      {category.icon === 'chart' && '📊'}
                    </div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Job Results */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {searchTerm || Object.values(filters).some(v => v) ? 'Search Results' : 'All Jobs'}
          </h2>
          <span className="text-gray-600">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or check back later for new opportunities.
              </p>
              <Button onClick={clearFilters}>Clear all filters</Button>
            </CardContent>
          </Card>
        )}

        {/* Footer CTA */}
        <div className="mt-16 bg-primary rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Don't see the perfect role?</h2>
          <p className="text-lg mb-6">
            We're always looking for talented individuals to join our team.
          </p>
          <Button variant="secondary" size="lg">
            Send us your resume
          </Button>
        </div>
      </div>
    </Layout>
  );
}
