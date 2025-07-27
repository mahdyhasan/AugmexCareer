import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Upload, FileText, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Layout } from "@/components/Layout";
import { DynamicForm } from "@/components/DynamicForm";
import { useToast } from "@/hooks/use-toast";
import { Job, FormField as FormFieldType } from "@/types";

const applicationSchema = z.object({
  candidateName: z.string().min(1, "Full name is required"),
  candidateEmail: z.string().email("Valid email is required"),
  candidatePhone: z.string().optional(),
  coverLetter: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function Apply() {
  const { jobId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const { data: jobData, isLoading } = useQuery<{ job: Job }>({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      coverLetter: "",
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!jobData?.job) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 text-6xl mb-4">❓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Job not found</h3>
              <p className="text-gray-600 mb-4">
                The job you're trying to apply for doesn't exist or may have been removed.
              </p>
              <Button onClick={() => setLocation("/jobs")}>
                Back to Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const job = jobData.job;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('doc')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOC file.",
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
      
      setResumeFile(file);
    }
  };

  const handleBasicInfoSubmit = (data: ApplicationFormData) => {
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleDynamicFormSubmit = async (dynamicData: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add basic application data
      const basicData = form.getValues();
      formData.append('jobId', jobId!);
      formData.append('candidateName', basicData.candidateName);
      formData.append('candidateEmail', basicData.candidateEmail);
      formData.append('candidatePhone', basicData.candidatePhone || '');
      formData.append('coverLetter', basicData.coverLetter || '');
      
      // Add resume file
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      
      // Add dynamic form data
      const dynamicFormData: any = {};
      if (dynamicData instanceof FormData) {
        for (const [key, value] of dynamicData.entries()) {
          if (key !== 'resume') {
            dynamicFormData[key] = value;
          }
        }
      }
      formData.append('applicationData', JSON.stringify(dynamicFormData));

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      toast({
        title: "Application submitted successfully!",
        description: "We'll review your application and get back to you soon.",
      });

      setLocation('/jobs');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultFormFields: FormFieldType[] = [
    {
      id: 'experience',
      type: 'textarea',
      label: 'Relevant Experience',
      placeholder: 'Briefly describe your relevant work experience...',
      required: true,
    },
    {
      id: 'motivation',
      type: 'textarea',
      label: 'Why are you interested in this role?',
      placeholder: 'Tell us what motivates you to apply for this position...',
      required: true,
    },
    {
      id: 'availability',
      type: 'select',
      label: 'Availability',
      options: ['Immediately', 'Within 2 weeks', 'Within 1 month', 'Other'],
      required: true,
    },
    {
      id: 'salary_expectation',
      type: 'text',
      label: 'Salary Expectation (Optional)',
      placeholder: 'e.g., $80,000 - $100,000',
      required: false,
    },
  ];

  const dynamicFields = job.applicationFormConfig?.fields || defaultFormFields;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => step === 1 ? setLocation(`/jobs/${job.slug}`) : setStep(1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === 1 ? 'Back to Job' : 'Previous Step'}
        </Button>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <User className="h-4 w-4" />
            </div>
            <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <FileText className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Job Info Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Apply for {job.title}
              </h1>
              <p className="text-gray-600">TechCorp • {job.location}</p>
            </div>
          </CardContent>
        </Card>

        {step === 1 ? (
          /* Step 1: Basic Information & Resume */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Personal Information & Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleBasicInfoSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="candidateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="candidateEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="candidatePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Resume Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Resume *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-sm">
                        {resumeFile ? (
                          <div>
                            <p className="font-medium text-green-600">
                              ✓ {resumeFile.name}
                            </p>
                            <p className="text-gray-500 mt-1">
                              {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-gray-500 mt-1">PDF or DOC up to 10MB</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        {resumeFile ? 'Change File' : 'Choose File'}
                      </label>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="coverLetter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Letter (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Tell us why you're the perfect fit for this role..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Continue to Application Details
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          /* Step 2: Dynamic Application Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DynamicForm
                fields={dynamicFields}
                onSubmit={handleDynamicFormSubmit}
                loading={loading}
                submitText="Submit Application"
              />
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            By submitting this application, you consent to TechCorp processing your personal data
            in accordance with our privacy policy.
          </p>
        </div>
      </div>
    </Layout>
  );
}
