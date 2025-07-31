import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { ApplicationsKanban } from "@/components/ApplicationsKanban";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Grid, LayoutGrid } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  status: string;
  appliedAt: string;
  aiScore?: number;
  resumeUrl?: string;
  coverLetter?: string;
  location?: string;
  currentCompany?: string;
  currentRole?: string;
  yearsOfExperience?: string;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  employmentType: string;
  status: string;
}

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  screened: { label: 'Screened', color: 'bg-yellow-100 text-yellow-800' },
  online_interview: { label: 'Interview', color: 'bg-purple-100 text-purple-800' },
  assessed: { label: 'Assessed', color: 'bg-orange-100 text-orange-800' },
  offer_letter: { label: 'Offer Sent', color: 'bg-green-100 text-green-800' },
  hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
};

export default function JobApplications() {
  const { jobId } = useParams();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const { data: jobData } = useQuery<{ job: Job }>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });

  const { data: applicationsData, isLoading } = useQuery<{ applications: Application[] }>({
    queryKey: [`/api/applications?jobId=${jobId}`],
    enabled: !!jobId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications?jobId=${jobId}`] });
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const applications = applicationsData?.applications || [];
  const job = jobData?.job;

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    updateStatusMutation.mutate({ applicationId, status: newStatus });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const TableView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Applications ({applications.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{application.candidateName}</div>
                    <div className="text-sm text-gray-500">{application.candidateEmail}</div>
                    <div className="text-sm text-gray-500">{application.currentRole} at {application.currentCompany}</div>
                  </div>
                </TableCell>
                <TableCell>{application.location || 'N/A'}</TableCell>
                <TableCell>{application.yearsOfExperience || 'N/A'}</TableCell>
                <TableCell>
                  {application.aiScore ? (
                    <Badge variant={application.aiScore >= 80 ? 'default' : 'secondary'}>
                      {application.aiScore}/100
                    </Badge>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]?.color}>
                    {STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]?.label || application.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(application.appliedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplication(application)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/job-management">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Applications for {job?.title}
              </h1>
              <p className="text-sm text-gray-600">
                {applications.length} total applications
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Grid className="h-4 w-4 mr-2" />
              Table View
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban Board
            </Button>
          </div>
        </div>

        {/* Job Details */}
        {job && (
          <Card>
            <CardHeader>
              <CardTitle>{job.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p>{job.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Employment Type</p>
                  <p className="capitalize">{job.employmentType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications View */}
        {viewMode === 'table' ? (
          <TableView />
        ) : (
          <ApplicationsKanban 
            applications={applications} 
            onStatusChange={handleStatusChange}
            isJobSpecific={true}
          />
        )}

        {/* Application Details Modal */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedApplication.candidateName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{selectedApplication.candidateEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p>{selectedApplication.candidatePhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p>{selectedApplication.location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Experience</p>
                    <p>{selectedApplication.yearsOfExperience || 'N/A'}</p>
                  </div>
                </div>
                
                {selectedApplication.coverLetter && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Cover Letter</p>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm">{selectedApplication.coverLetter}</p>
                    </div>
                  </div>
                )}
                
                {selectedApplication.resumeUrl && (
                  <div>
                    <Button variant="outline" asChild>
                      <a href={selectedApplication.resumeUrl} target="_blank" rel="noopener noreferrer">
                        View Resume
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}