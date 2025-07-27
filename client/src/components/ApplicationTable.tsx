import { useState } from "react";
import { Eye, Download, Calendar, MoreHorizontal } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Application } from "@/types";
import { ResumeModal } from "./ResumeModal";

interface ApplicationTableProps {
  applications: Application[];
  onStatusUpdate?: (applicationId: string, status: string) => void;
}

export function ApplicationTable({ applications, onStatusUpdate }: ApplicationTableProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800';
      case 'interviewed':
        return 'bg-orange-100 text-orange-800';
      case 'hired':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                      {application.candidateName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {application.candidateName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.candidateEmail}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm text-gray-900">Job Position</div>
                  <div className="text-sm text-gray-500">
                    Applied {formatDate(application.appliedAt)}
                  </div>
                </TableCell>
                
                <TableCell>
                  {application.aiScore ? (
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 mr-2">
                        {application.aiScore}%
                      </div>
                      <Progress 
                        value={application.aiScore} 
                        className="w-16 h-2"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Not analyzed</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {formatDate(application.appliedAt)}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {application.resumeUrl && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm">
                      <Calendar className="h-4 w-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onStatusUpdate?.(application.id, 'shortlisted')}
                        >
                          Move to Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onStatusUpdate?.(application.id, 'interviewed')}
                        >
                          Mark as Interviewed
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onStatusUpdate?.(application.id, 'rejected')}
                        >
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedApplication && (
        <ResumeModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </>
  );
}
