import { useState } from "react";
import { Link } from "wouter";
import { Edit, Pause, Play, Trash2, MoreHorizontal, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobWithApplications } from "@/types";
import { CreateJobModal } from "./CreateJobModal";

interface JobTableProps {
  jobs: JobWithApplications[];
  onJobUpdate?: () => void;
}

export function JobTable({ jobs, onJobUpdate }: JobTableProps) {
  const [selectedJob, setSelectedJob] = useState<JobWithApplications | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.ceil(diffDays / 7)} weeks ago`;
  };

  const handleEdit = (job: JobWithApplications) => {
    setSelectedJob(job);
    setIsEditModalOpen(true);
  };

  const handleStatusToggle = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onJobUpdate?.();
      }
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onJobUpdate?.();
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {job.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {job.employmentType} • {job.remoteType}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {job.employmentType}
                  </span>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-900 font-medium">
                    {job.applicationCount || 0}
                  </span>
                  <span className="text-sm text-gray-500"> applications</span>
                </TableCell>
                
                <TableCell>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {formatDate(job.createdAt)}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Link href={`/job-applications/${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        Applications
                      </Button>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(job)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusToggle(job.id, job.status)}
                    >
                      {job.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isEditModalOpen && selectedJob && (
        <CreateJobModal
          job={selectedJob}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedJob(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedJob(null);
            onJobUpdate?.();
          }}
        />
      )}
    </>
  );
}
