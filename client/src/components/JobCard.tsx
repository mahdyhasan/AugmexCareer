import { MapPin, Clock, DollarSign, Briefcase } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "@/types";
import { Link } from "wouter";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const formatSalary = () => {
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }
    return "Salary not disclosed";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently posted";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-medium text-gray-900">{job.title}</h3>
            <p className="text-sm text-gray-600">Augmex</p>
          </div>
          <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center text-xs text-gray-600">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          <span>{job.location || 'Location not specified'}</span>
          {job.remoteType && (
            <>
              <span className="mx-2">•</span>
              <span className="capitalize">{job.remoteType}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center text-xs text-gray-600">
          <Briefcase className="h-3.5 w-3.5 mr-1" />
          <span className="capitalize">{job.employmentType}</span>
          <span className="mx-2">•</span>
          <span className="capitalize">{job.experienceLevel}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-600">
          <DollarSign className="h-3.5 w-3.5 mr-1" />
          <span>{formatSalary()}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-600">
          <Clock className="h-3.5 w-3.5 mr-1" />
          <span>{formatDate(job.createdAt)}</span>
        </div>
        
        <p className="text-sm text-gray-700 line-clamp-3">
          {job.description}
        </p>
        
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{job.skills.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Link href={`/jobs/${job.slug}`}>
          <Button className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
