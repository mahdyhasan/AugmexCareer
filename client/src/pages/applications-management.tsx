import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  Star,
  ChevronRight,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  status: 'submitted' | 'screened' | 'interviewed' | 'offer' | 'rejected' | 'hired';
  appliedAt: string;
  aiScore?: number;
  resumeUrl?: string;
  coverLetter?: string;
}

const STATUS_CONFIG = {
  submitted: { label: 'New', color: 'bg-blue-100 text-blue-800', order: 1 },
  screened: { label: 'Screened', color: 'bg-yellow-100 text-yellow-800', order: 2 },
  interviewed: { label: 'Interviewed', color: 'bg-purple-100 text-purple-800', order: 3 },
  offer: { label: 'Offer Sent', color: 'bg-orange-100 text-orange-800', order: 4 },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-800', order: 5 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', order: 6 },
};

export default function ApplicationsManagement() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const { data: applicationsData, isLoading } = useQuery<{ applications: Application[] }>({
    queryKey: ['/api/applications'],
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: "Status Updated",
        description: "Application status has been updated and candidate has been notified via email.",
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
  const filteredApplications = selectedStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === selectedStatus);

  const groupedApplications = Object.keys(STATUS_CONFIG).reduce((acc, status) => {
    acc[status] = filteredApplications.filter(app => app.status === status);
    return acc;
  }, {} as Record<string, Application[]>);

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    updateStatusMutation.mutate({ applicationId, status: newStatus });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Applications Management</h1>
            <p className="text-sm text-gray-600">Track and manage candidate applications</p>
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kanban View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Card key={status} className="min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{config.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {groupedApplications[status]?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))
                ) : (
                  groupedApplications[status]?.map((application) => (
                    <div
                      key={application.id}
                      className="p-3 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium truncate">{application.candidateName}</h4>
                        {application.aiScore && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span className="text-xs">{application.aiScore}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2 truncate">{application.jobTitle}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </span>
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedApplication.candidateName}</span>
                  <Badge className={STATUS_CONFIG[selectedApplication.status].color}>
                    {STATUS_CONFIG[selectedApplication.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedApplication.candidateEmail}</span>
                  </div>
                  {selectedApplication.candidatePhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedApplication.candidatePhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Applied {new Date(selectedApplication.appliedAt).toLocaleDateString()}</span>
                  </div>
                  {selectedApplication.aiScore && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm">AI Score: {selectedApplication.aiScore}/100</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Position Applied For</h4>
                  <p className="text-sm text-gray-600">{selectedApplication.jobTitle}</p>
                </div>

                {selectedApplication.coverLetter && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cover Letter</h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedApplication.coverLetter}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-2">Change Status</h4>
                  <Select 
                    value={selectedApplication.status} 
                    onValueChange={(value) => handleStatusChange(selectedApplication.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  {selectedApplication.resumeUrl && (
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Resume
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setSelectedApplication(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}