import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Filter, 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign,
  X,
  Sliders
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface JobFiltersProps {
  onFiltersChange: (filters: JobFilters) => void;
  totalJobs: number;
  filteredJobs: number;
}

export interface JobFilters {
  search: string;
  location: string;
  department: string[];
  employmentType: string[];
  experienceLevel: string[];
  remoteType: string[];
  salaryRange: [number, number];
  skills: string[];
}

const initialFilters: JobFilters = {
  search: "",
  location: "",
  department: [],
  employmentType: [],
  experienceLevel: [],
  remoteType: [],
  salaryRange: [0, 200000],
  skills: []
};

export function JobFilters({ onFiltersChange, totalJobs, filteredJobs }: JobFiltersProps) {
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  const departments = [
    "Engineering", "Product", "Design", "Marketing", 
    "Sales", "Customer Success", "Operations", "HR", "Finance"
  ];

  const employmentTypes = [
    "Full-time", "Part-time", "Contract", "Internship", "Freelance"
  ];

  const experienceLevels = [
    "Entry", "Mid", "Senior", "Lead", "Executive"
  ];

  const remoteTypes = [
    "Remote", "Hybrid", "On-site"
  ];

  const popularSkills = [
    "JavaScript", "React", "TypeScript", "Python", "Node.js",
    "AWS", "Docker", "Kubernetes", "Machine Learning", "SQL",
    "Java", "Go", "Rust", "GraphQL", "MongoDB"
  ];

  const updateFilters = (newFilters: Partial<JobFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const clearAllFilters = () => {
    setFilters(initialFilters);
    onFiltersChange(initialFilters);
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.location || 
           filters.department.length > 0 ||
           filters.employmentType.length > 0 ||
           filters.experienceLevel.length > 0 ||
           filters.remoteType.length > 0 ||
           filters.skills.length > 0;
  };

  const toggleArrayFilter = (key: keyof JobFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilters({ [key]: updated });
  };

  return (
    <div className="space-y-4">
      {/* Quick Search and Location */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs, companies, or keywords..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Location (city, state, country)"
                className="pl-10"
                value={filters.location}
                onChange={(e) => updateFilters({ location: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {filteredJobs} of {totalJobs} jobs
          </span>
          {hasActiveFilters() && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden"
        >
          <Sliders className="h-4 w-4 mr-2" />
          Filters {hasActiveFilters() && `(${Object.values(filters).flat().filter(Boolean).length})`}
        </Button>
      </div>

      {/* Active Filters */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilters({ search: "" })}
              />
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              Location: {filters.location}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilters({ location: "" })}
              />
            </Badge>
          )}
          {[...filters.department, ...filters.employmentType, ...filters.experienceLevel, ...filters.remoteType, ...filters.skills].map((filter, index) => (
            <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
              {filter}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => {
                  // Remove from appropriate array
                  if (filters.department.includes(filter)) {
                    toggleArrayFilter('department', filter);
                  } else if (filters.employmentType.includes(filter)) {
                    toggleArrayFilter('employmentType', filter);
                  } else if (filters.experienceLevel.includes(filter)) {
                    toggleArrayFilter('experienceLevel', filter);
                  } else if (filters.remoteType.includes(filter)) {
                    toggleArrayFilter('remoteType', filter);
                  } else if (filters.skills.includes(filter)) {
                    toggleArrayFilter('skills', filter);
                  }
                }}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Department */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {departments.map((dept) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept}`}
                      checked={filters.department.includes(dept)}
                      onCheckedChange={() => toggleArrayFilter('department', dept)}
                    />
                    <Label htmlFor={`dept-${dept}`} className="text-sm font-normal">
                      {dept}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Employment Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Employment Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {employmentTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.employmentType.includes(type)}
                      onCheckedChange={() => toggleArrayFilter('employmentType', type)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm font-normal">
                      {type}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Experience Level */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Experience Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {experienceLevels.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exp-${level}`}
                      checked={filters.experienceLevel.includes(level)}
                      onCheckedChange={() => toggleArrayFilter('experienceLevel', level)}
                    />
                    <Label htmlFor={`exp-${level}`} className="text-sm font-normal">
                      {level}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Remote Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Work Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {remoteTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`remote-${type}`}
                      checked={filters.remoteType.includes(type)}
                      onCheckedChange={() => toggleArrayFilter('remoteType', type)}
                    />
                    <Label htmlFor={`remote-${type}`} className="text-sm font-normal">
                      {type}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Popular Skills */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Popular Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant={filters.skills.includes(skill) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      filters.skills.includes(skill) 
                        ? "bg-blue-600 text-white" 
                        : "hover:bg-blue-50 hover:border-blue-300"
                    }`}
                    onClick={() => toggleArrayFilter('skills', skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}