import { useState } from "react";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ParsedResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    githubUrl?: string;
  };
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear?: string;
  }>;
  skills: string[];
  summary?: string;
  totalExperience?: string;
}

interface ResumeUploadParserProps {
  onFormDataExtracted: (formData: any) => void;
  onResumeUploaded: (resumeUrl: string) => void;
}

export function ResumeUploadParser({ onFormDataExtracted, onResumeUploaded }: ResumeUploadParserProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setParsing(true);

    try {
      // Upload and parse resume
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const result = await response.json();
      
      if (result.success) {
        setParsedData(result.parsedData);
        
        // Auto-fill form with extracted data
        onFormDataExtracted(result.formData);
        
        // Upload resume file separately for storage
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          onResumeUploaded(uploadResult.url);
        }

        toast({
          title: "Resume parsed successfully",
          description: "Form fields have been auto-filled with your resume data.",
        });
      } else {
        throw new Error('Resume parsing failed');
      }
    } catch (error) {
      console.error('Resume parsing error:', error);
      toast({
        title: "Resume parsing failed",
        description: "Please fill out the form manually or try a different file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setParsing(false);
    }
  };

  const handleAutoFillClick = () => {
    if (parsedData) {
      const formData = {
        candidateName: parsedData.personalInfo?.name || '',
        candidateEmail: parsedData.personalInfo?.email || '',
        candidatePhone: parsedData.personalInfo?.phone || '',
        location: parsedData.personalInfo?.location || '',
        linkedinProfile: parsedData.personalInfo?.linkedinUrl || '',
        gitProfile: parsedData.personalInfo?.githubUrl || '',
        currentCompany: parsedData.experience?.[0]?.company || '',
        currentRole: parsedData.experience?.[0]?.role || '',
        timeWithCurrentCompany: parsedData.experience?.[0]?.duration || '',
        yearsOfExperience: parsedData.totalExperience || '',
        coverLetter: parsedData.summary || '',
      };
      
      onFormDataExtracted(formData);
      
      toast({
        title: "Form auto-filled",
        description: "Your information has been filled based on your resume.",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="resume-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <div className="animate-spin">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                  </div>
                ) : uploadedFile ? (
                  <Check className="w-8 h-8 mb-3 text-green-500" />
                ) : (
                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                )}
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  {uploadedFile ? (
                    <span className="font-semibold text-green-600">
                      {uploadedFile.name} uploaded
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold">Click to upload resume</span> or drag and drop
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, DOC, or DOCX (MAX. 10MB)
                </p>
              </div>
              <input
                id="resume-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Parsing Status */}
      {isParsing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-gray-600">
                Parsing your resume with AI... This may take a moment.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsed Data Preview */}
      {parsedData && !isParsing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                Resume Parsed Successfully
              </h3>
              <Button onClick={handleAutoFillClick} size="sm">
                Auto-fill Form
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              {parsedData.personalInfo?.name && (
                <div>
                  <span className="font-medium">Name:</span> {parsedData.personalInfo.name}
                </div>
              )}
              {parsedData.personalInfo?.email && (
                <div>
                  <span className="font-medium">Email:</span> {parsedData.personalInfo.email}
                </div>
              )}
              {parsedData.experience?.length > 0 && (
                <div>
                  <span className="font-medium">Current Role:</span> {parsedData.experience[0].role} at {parsedData.experience[0].company}
                </div>
              )}
              {parsedData.skills?.length > 0 && (
                <div>
                  <span className="font-medium">Skills:</span> {parsedData.skills.slice(0, 5).join(', ')}
                  {parsedData.skills.length > 5 && ` +${parsedData.skills.length - 5} more`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {uploadedFile && !parsedData && !isParsing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">
                Resume uploaded but parsing failed. You can still fill the form manually.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}