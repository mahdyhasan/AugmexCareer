import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  Phone, 
  Calendar, 
  Star, 
  FileText, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle?: string;
  status: string;
  appliedAt: string;
  aiScore?: number;
  resumeUrl?: string;
  coverLetter?: string;
}

interface KanbanColumnProps {
  title: string;
  status: string;
  applications: Application[];
  color: string;
  icon: React.ReactNode;
  onStatusChange: (applicationId: string, newStatus: string) => void;
  onApplicationClick: (application: Application) => void;
}

const STATUS_CONFIG = {
  'applied': { 
    label: 'Applied', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50',
    icon: <Mail className="h-4 w-4" />
  },
  'screened': { 
    label: 'Screened', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50',
    icon: <AlertCircle className="h-4 w-4" />
  },
  'interviewed': { 
    label: 'Interviewed', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    bgColor: 'bg-purple-50',
    icon: <User className="h-4 w-4" />
  },
  'offer': { 
    label: 'Offer Sent', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50',
    icon: <Clock className="h-4 w-4" />
  },
  'hired': { 
    label: 'Hired', 
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50',
    icon: <CheckCircle className="h-4 w-4" />
  },
  'rejected': { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50',
    icon: <XCircle className="h-4 w-4" />
  },
};

function KanbanColumn({ title, status, applications, color, icon, onStatusChange, onApplicationClick }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const applicationId = e.dataTransfer.getData("text/plain");
    if (applicationId) {
      onStatusChange(applicationId, status);
    }
  };

  return (
    <div 
      className={`flex-1 min-w-80 ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.bgColor || 'bg-gray-50'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`p-4 border-b-2 ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-medium text-gray-900">{title}</h3>
          </div>
          <Badge variant="secondary" className="bg-white">
            {applications.length}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-3 min-h-96 overflow-y-auto">
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onClick={() => onApplicationClick(application)}
          />
        ))}
        
        {applications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">No applications</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
}

function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", application.id);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm text-gray-900 truncate flex-1">
              {application.candidateName}
            </h4>
            {application.aiScore && (
              <div className="flex items-center gap-1 ml-2">
                <Star className="h-3 w-3 text-yellow-400" />
                <span className="text-xs text-gray-600">{application.aiScore}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="h-3 w-3" />
              <span className="truncate">{application.candidateEmail}</span>
            </div>
            
            {application.candidatePhone && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{application.candidatePhone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          {application.jobTitle && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded truncate">
              {application.jobTitle}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2">
            <Badge className={`text-xs ${STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-800'}`}>
              {STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]?.label || application.status}
            </Badge>
            
            {application.resumeUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(application.resumeUrl, '_blank');
                }}
              >
                <FileText className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ApplicationsKanbanProps {
  applications: Application[];
  onStatusChange: (applicationId: string, newStatus: string) => void;
  onApplicationClick: (application: Application) => void;
}

export function ApplicationsKanban({ applications, onStatusChange, onApplicationClick }: ApplicationsKanbanProps) {
  const columns = [
    { status: 'applied', title: 'Applied' },
    { status: 'screened', title: 'Screened' },
    { status: 'interviewed', title: 'Interviewed' },
    { status: 'offer', title: 'Offer Sent' },
    { status: 'hired', title: 'Hired' },
    { status: 'rejected', title: 'Rejected' },
  ];

  const getApplicationsByStatus = (status: string) => {
    return applications.filter(app => app.status === status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const config = STATUS_CONFIG[column.status as keyof typeof STATUS_CONFIG];
        return (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            applications={getApplicationsByStatus(column.status)}
            color={config?.color || 'bg-gray-100 text-gray-800'}
            icon={config?.icon || <Mail className="h-4 w-4" />}
            onStatusChange={onStatusChange}
            onApplicationClick={onApplicationClick}
          />
        );
      })}
    </div>
  );
}