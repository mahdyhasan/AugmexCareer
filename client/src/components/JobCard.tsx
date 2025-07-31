import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Users,
  Calendar,
  Briefcase,
  ArrowRight
} from "lucide-react";

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
}

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return "Competitive";
    if (job.salaryMin && job.salaryMax) {
      return `$${parseInt(job.salaryMin).toLocaleString()} - $${parseInt(job.salaryMax).toLocaleString()}`;
    }
    if (job.salaryMin) return `From $${parseInt(job.salaryMin).toLocaleString()}`;
    if (job.salaryMax) return `Up to $${parseInt(job.salaryMax).toLocaleString()}`;
    return "Competitive";
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-blue-100 text-blue-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'entry': return 'bg-emerald-100 text-emerald-800';
      case 'mid': return 'bg-yellow-100 text-yellow-800';
      case 'senior': return 'bg-red-100 text-red-800';
      case 'lead': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getEmploymentTypeColor(job.employmentType)} variant="secondary">
                {job.employmentType}
              </Badge>
              <Badge className={getExperienceLevelColor(job.experienceLevel)} variant="secondary">
                {job.experienceLevel}
              </Badge>
              {job.remoteType && (
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  {job.remoteType}
                </Badge>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              {job.department && (
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  <span>{job.department}</span>
                </div>
              )}
              
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{getTimeAgo(job.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-lg font-semibold text-gray-900">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">{formatSalary()}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {job.description}
        </p>
        
        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 4).map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs px-2 py-1 bg-gray-50 text-gray-700 border-gray-200"
                >
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 4 && (
                <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50 text-gray-500">
                  +{job.skills.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Link href={`/jobs/${job.slug}`}>
            <Button variant="outline" size="sm" className="group-hover:border-blue-500 group-hover:text-blue-600">
              View Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
          
          <Link href={`/apply/${job.slug}`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Apply Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}