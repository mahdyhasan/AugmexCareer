import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  resumeUrl: string | null;
}

export function ResumeModal({ isOpen, onClose, candidateName, resumeUrl }: ResumeModalProps) {
  const handleDownload = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {candidateName}'s Resume
            </span>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleDownload} 
                size="sm" 
                variant="outline"
                disabled={!resumeUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={onClose} size="sm" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {resumeUrl ? (
            <iframe 
              src={resumeUrl} 
              className="w-full h-[600px] border rounded-lg"
              title={`${candidateName} Resume`}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px] border rounded-lg bg-gray-50">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No resume available</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}