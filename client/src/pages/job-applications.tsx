import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApplicationsKanban } from "@/components/ApplicationsKanban";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Calendar, FileText, Star } from "lucide-react";
import { InterviewScheduler } from "@/components/InterviewScheduler";
import { EnhancedAIPanel } from "@/components/EnhancedAIPanel";
import { type Application, type Job } from "@shared/schema";

export default function JobApplicationsPage() {
  const { jobId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  // Fetch applications for this specific job
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications", jobId],
    queryFn: async () => {
      const response = await fetch(`/api/applications?jobId=${jobId}`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
    enabled: !!jobId,
  });

  const applications = applicationsData?.applications || [];
  const jobData = job?.job as Job || null;

  const STATUS_CONFIG = {
    new: { label: "New", color: "bg-blue-100 text-blue-800" },
    reviewed: { label: "Reviewed", color: "bg-yellow-100 text-yellow-800" },
    interviewing: { label: "Interviewing", color: "bg-purple-100 text-purple-800" },
    hired: { label: "Hired", color: "bg-green-100 text-green-800" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  };

  // Update application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", jobId] });
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "reviewed": return "bg-yellow-100 text-yellow-800";
      case "interviewing": return "bg-purple-100 text-purple-800";
      case "hired": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (jobLoading || applicationsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!jobData && !jobLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-gray-600">The requested job could not be found.</p>
        </div>
      </div>
    );
  }

  if (!jobData) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Job Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{jobData.title}</h1>
            <p className="text-gray-600 mb-4">{jobData.location} • {jobData.employmentType}</p>
            <div className="flex gap-2 mb-4">
              <Badge variant="outline">{jobData.experienceLevel}</Badge>
              <Badge variant="outline">{jobData.remoteType}</Badge>
              <Badge className={jobData.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {jobData.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Posted on {formatDate(jobData.createdAt!.toString())}</p>
            <p className="text-lg font-semibold">{applications.length} Applications</p>
          </div>
        </div>

        {/* Job Description Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-600 mb-4">{jobData.description}</p>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{jobData.requirements}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Responsibilities</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line mb-4">{jobData.responsibilities}</p>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {(jobData?.skills || []).map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Applications ({applications.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4 mr-1" />
                Table
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Kanban
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application: Application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{application.candidateName}</p>
                          <p className="text-sm text-gray-500">{application.candidateEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(application.appliedAt!.toString())}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(application.status || "new")}>
                          {application.status || "new"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {application.aiScore ? (
                          <Badge variant="outline">
                            {Math.round(application.aiScore * 100)}%
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {application.resumeUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(application.resumeUrl || "", "_blank")}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {applications.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No applications found for this job.</p>
                </div>
              )}
            </div>
          ) : (
            <ApplicationsKanban 
              applications={applications}
            />
          )}
        </CardContent>
      </Card>

      {/* Application Dialog */}
      {selectedApplication && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-2xl" aria-describedby="application-details">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedApplication.candidateName}</span>
                <Badge className={STATUS_CONFIG[selectedApplication.status as keyof typeof STATUS_CONFIG]?.color || "bg-gray-100 text-gray-800"}>
                  {STATUS_CONFIG[selectedApplication.status as keyof typeof STATUS_CONFIG]?.label || selectedApplication.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div id="application-details" className="sr-only">
              Application details for {selectedApplication.candidateName}
            </div>
            
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
                  <span className="text-sm">Applied {new Date(selectedApplication.appliedAt!).toLocaleDateString()}</span>
                </div>
                {selectedApplication.aiScore && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm">AI Score: {Math.round(selectedApplication.aiScore * 100)}%</span>
                  </div>
                )}
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
                  value={selectedApplication.status || "new"} 
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({ applicationId: selectedApplication.id, status: value });
                    setSelectedApplication(null);
                  }}
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

              {/* Interview Scheduler */}
              <div className="border-t pt-4">
                <InterviewScheduler
                  applicationId={selectedApplication.id}
                  candidateName={selectedApplication.candidateName}
                  candidateEmail={selectedApplication.candidateEmail}
                />
              </div>

              {/* Enhanced AI Panel */}
              {selectedApplication.aiScore && (
                <div className="border-t pt-4">
                  <EnhancedAIPanel 
                    applicationId={selectedApplication.id} 
                    jobId={selectedApplication.jobId || ''}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                {selectedApplication.resumeUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(selectedApplication.resumeUrl || "", "_blank")}
                  >
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
  );
}