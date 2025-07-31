import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateJobModal } from "@/components/CreateJobModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Users,
  DollarSign,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
  salaryMin: string | null;
  salaryMax: string | null;
  status: string;
  createdAt: string;
}

export default function JobManagement() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: jobsData, isLoading } = useQuery<{ jobs: Job[] }>({
    queryKey: ['/api/jobs'],
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete job');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job Deleted",
        description: "The job has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const jobs = jobsData?.jobs || [];

  const formatSalary = (job: Job) => {
    if (job.salaryMin && job.salaryMax) {
      return `$${parseInt(job.salaryMin).toLocaleString()} - $${parseInt(job.salaryMax).toLocaleString()}`;
    }
    if (job.salaryMin) {
      return `From $${parseInt(job.salaryMin).toLocaleString()}`;
    }
    return "Salary not disclosed";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Job Management</h1>
            <p className="text-sm text-gray-600">Create and manage job postings</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Job
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs created yet</h3>
                <p className="text-gray-600 mb-4">Create your first job posting to start attracting candidates.</p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{job.title}</div>
                            <div className="text-xs text-gray-500">{job.department}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location || 'Remote'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {job.employmentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatSalary(job)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={job.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/job-applications/${job.id}`}>
                            <div className="flex items-center text-xs hover:text-blue-600 cursor-pointer">
                              <Users className="h-3 w-3 mr-1" />
                              View Applications
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Link href={`/jobs/${job.slug}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
                            <Link href={`/edit-job/${job.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteJobMutation.mutate(job.id)}
                              disabled={deleteJobMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Job Modal */}
        <CreateJobModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      </div>
    </Layout>
  );
}