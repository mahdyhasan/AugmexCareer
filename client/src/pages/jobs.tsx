import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { JobCard } from "@/components/JobCard";
import { JobFilters, type JobFilters as JobFiltersType } from "@/components/JobFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  Globe,
  ArrowRight,
  Star,
  Award,
  Target
} from "lucide-react";
import { JobAlertsSubscription } from "@/components/JobAlertsSubscription";

// Define Job type inline since types are in shared/schema.ts
interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string | null;
  department: string | null;
  employmentType: string;
  experienceLevel: string;
  remoteType: string | null;
  salaryMin: string | null;
  salaryMax: string | null;
  skills: string[] | null;
  createdAt: string;
  status: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export default function Jobs() {
  const [filters, setFilters] = useState<JobFiltersType>({
    search: "",
    location: "",
    department: [],
    employmentType: [],
    experienceLevel: [],
    remoteType: [],
    salaryRange: [0, 200000],
    skills: []
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery<{ jobs: Job[] }>({
    queryKey: ['/api/jobs'],
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ['/api/categories'],
  });

  const jobs = jobsData?.jobs || [];
  const categories = categoriesData?.categories || [];

  // Create a map of categoryId to category name for efficient lookup
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach(cat => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  // Filter jobs based on current filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Get job's department name from categoryId
      const jobDepartment = categoryMap.get(job.categoryId);
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          job.title,
          job.description,
          jobDepartment,
          job.location,
          ...(job.skills || [])
        ].join(" ").toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Location filter
      if (filters.location && job.location) {
        if (!job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }

      // Department filter
      if (filters.department.length > 0 && jobDepartment) {
        if (!filters.department.includes(jobDepartment)) return false;
      }

      // Employment type filter
      if (filters.employmentType.length > 0) {
        if (!filters.employmentType.some(type => 
          job.employmentType.toLowerCase().includes(type.toLowerCase())
        )) return false;
      }

      // Experience level filter
      if (filters.experienceLevel.length > 0) {
        if (!filters.experienceLevel.some(level => 
          job.experienceLevel.toLowerCase().includes(level.toLowerCase())
        )) return false;
      }

      // Remote type filter
      if (filters.remoteType.length > 0 && job.remoteType) {
        if (!filters.remoteType.includes(job.remoteType)) return false;
      }

      // Skills filter
      if (filters.skills.length > 0 && job.skills) {
        if (!filters.skills.some(skill => 
          job.skills!.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )) return false;
      }

      return true;
    });
  }, [jobs, filters, categoryMap]);

  if (jobsLoading || categoriesLoading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Shape the Future with{" "}
              <span className="text-blue-600">Augmex</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Join a team of innovators building cutting-edge solutions that transform industries. 
              Discover your next career opportunity and make an impact that matters.
            </p>
            
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>500+ Team Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span>Remote-First Culture</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span>Award-Winning Workplace</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="border-2 border-blue-100 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Innovation First</h3>
                  <p className="text-sm text-gray-600">Work on cutting-edge projects that shape the future</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-purple-100 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Growth Mindset</h3>
                  <p className="text-sm text-gray-600">Continuous learning and career development</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-green-100 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Work-Life Balance</h3>
                  <p className="text-sm text-gray-600">Flexible schedules and comprehensive benefits</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Job Filters */}
        <div className="mb-8">
          <JobFilters 
            onFiltersChange={setFilters}
            totalJobs={jobs.length}
            filteredJobs={filteredJobs.length}
          />
        </div>

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Browse by Department</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 group"
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    department: prev.department.includes(category.name) 
                      ? prev.department.filter(d => d !== category.name)
                      : [...prev.department, category.name]
                  }))}
                >
                  <CardContent className="p-4 text-center">
                    <Briefcase className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                    )}
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {jobs.filter(job => job.categoryId === category.id).length} positions
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Job Listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {filteredJobs.length > 0 ? `${filteredJobs.length} Open Positions` : 'No positions found'}
            </h2>
            
            {filteredJobs.length > 0 && (
              <div className="flex items-center gap-4">
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="department">Department</option>
                </select>
              </div>
            )}
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {jobs.length === 0 ? 'No jobs available' : 'No jobs match your criteria'}
              </h3>
              <p className="text-gray-600 mb-6">
                {jobs.length === 0 
                  ? 'Check back later for new opportunities.' 
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
              {filteredJobs.length === 0 && jobs.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    search: "",
                    location: "",
                    department: [],
                    employmentType: [],
                    experienceLevel: [],
                    remoteType: [],
                    salaryRange: [0, 200000],
                    skills: []
                  })}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Job Alerts Subscription */}
        <div className="mb-8">
          <JobAlertsSubscription />
        </div>

        {/* Call to Action */}
        {filteredJobs.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Don't see a perfect fit?</h3>
            <p className="text-blue-100 mb-6">
              We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Link href="/general-apply">
              <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
                Submit General Application
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}