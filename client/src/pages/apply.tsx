import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Building2, Clock, DollarSign, Users, FileText, CheckCircle } from "lucide-react";
import type { Job } from "@shared/schema";
import augmexLogo from "@assets/augmex_logo_retina_1753883414771.png";

// Application form schema
const applicationSchema = z.object({
  candidateName: z.string().min(2, "Name must be at least 2 characters"),
  candidateEmail: z.string().email("Please enter a valid email"),
  candidatePhone: z.string().min(10, "Please enter a valid phone number"),
  location: z.string().min(2, "Please enter your location"),
  currentCompany: z.string().min(1, "Please enter your current company"),
  currentRole: z.string().min(1, "Please enter your current role"),
  timeWithCurrentCompany: z.string().min(1, "Please specify time with current company"),
  yearsOfExperience: z.string().min(1, "Please specify years of experience"),
  linkedinProfile: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  gitProfile: z.string().url("Please enter a valid Git profile URL").optional().or(z.literal("")),
  coverLetter: z.string().optional(),
  resume: z.any().optional(),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function ApplyPage() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDeveloperRole, setIsDeveloperRole] = useState(false);

  // Fetch job details
  const { data: jobData, isLoading } = useQuery({
    queryKey: ["/api/jobs/slug", slug],
    queryFn: async () => {
      if (!slug || typeof slug !== 'string') throw new Error("No job slug provided");
      const response = await apiRequest(`/api/jobs/slug/${slug}`);
      return response;
    },
    enabled: !!slug && typeof slug === 'string',
  });

  const job: Job = jobData?.job;

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      location: "",
      currentCompany: "",
      currentRole: "",
      timeWithCurrentCompany: "",
      yearsOfExperience: "",
      linkedinProfile: "",
      gitProfile: "",
      coverLetter: "",
    },
  });

  // Check for duplicate application
  const checkDuplicateMutation = useMutation({
    mutationFn: async (data: { email: string; phone: string; jobId: string }) => {
      const response = await fetch("/api/applications/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check duplicate");
      }
      return response.json();
    },
  });

  // Submit application
  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/applications", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        throw new Error("Failed to submit application");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you for your interest in Augmex. We'll review your application and get back to you soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ApplicationForm) => {
    if (!job) return;

    // Check for duplicate application first
    try {
      await checkDuplicateMutation.mutateAsync({
        email: data.candidateEmail,
        phone: data.candidatePhone,
        jobId: job.id,
      });
    } catch (error: any) {
      if (error.message?.includes("already applied")) {
        toast({
          title: "Duplicate Application",
          description: "You have already submitted an application for this position.",
          variant: "destructive",
        });
        return;
      }
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("jobId", job.id);
    formData.append("candidateName", data.candidateName);
    formData.append("candidateEmail", data.candidateEmail);
    formData.append("candidatePhone", data.candidatePhone);
    formData.append("location", data.location);
    formData.append("currentCompany", data.currentCompany);
    formData.append("currentRole", data.currentRole);
    formData.append("timeWithCurrentCompany", data.timeWithCurrentCompany);
    formData.append("yearsOfExperience", data.yearsOfExperience);
    formData.append("linkedinProfile", data.linkedinProfile || "");
    formData.append("gitProfile", data.gitProfile || "");
    formData.append("coverLetter", data.coverLetter || "");

    // Add resume file if selected
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      formData.append("resume", fileInput.files[0]);
    }

    submitMutation.mutate(formData);
  };

  // Auto-detect if it's a developer role
  const handleRoleChange = (value: string) => {
    const developerKeywords = ["developer", "engineer", "programmer", "frontend", "backend", "fullstack", "software"];
    setIsDeveloperRole(developerKeywords.some(keyword => 
      value.toLowerCase().includes(keyword) || job?.title.toLowerCase().includes(keyword)
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/jobs")}>
            View All Jobs
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in the {job.title} position at Augmex. 
              We'll review your application and get back to you within 2-3 business days.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setLocation("/jobs")} className="w-full">
                View More Jobs
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "https://augmex.io"} 
                className="w-full"
              >
                Visit Augmex.io
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={augmexLogo} 
              alt="Augmex" 
              className="h-8"
            />
            <div className="text-sm text-gray-500">
              augmex.io/career/job-applications
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Job Details Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  Augmex
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{job.location || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="capitalize">{job.employmentType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="capitalize">{job.experienceLevel} Level</span>
                </div>
                {(job.salaryMin || job.salaryMax) && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>
                      {job.salaryMin && job.salaryMax 
                        ? `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()}`
                        : job.salaryMin 
                        ? `From $${Number(job.salaryMin).toLocaleString()}`
                        : `Up to $${Number(job.salaryMax).toLocaleString()}`
                      }
                    </span>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Job Description</h4>
                  <p className="text-sm text-gray-600 line-clamp-4">
                    {job.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Apply for {job.title}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Fill out the form below to submit your application. All fields marked with * are required.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Personal Information</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
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

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="candidatePhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Location *</FormLabel>
                              <FormControl>
                                <Input placeholder="New York, NY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Professional Information</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="currentCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Company *</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Corp" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currentRole"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Role *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Software Engineer" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleRoleChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="timeWithCurrentCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time with Current Company *</FormLabel>
                              <FormControl>
                                <Input placeholder="2 years 3 months" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="yearsOfExperience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Years of Experience *</FormLabel>
                              <FormControl>
                                <Input placeholder="5 years" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Online Profiles */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Online Profiles</h3>
                      
                      <FormField
                        control={form.control}
                        name="linkedinProfile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn Profile</FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isDeveloperRole && (
                        <FormField
                          control={form.control}
                          name="gitProfile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Git Profile (GitHub/GitLab)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://github.com/johndoe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Resume Upload */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Documents</h3>
                      
                      <div>
                        <Label htmlFor="resume">Upload Resume *</Label>
                        <Input
                          id="resume"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="mt-1"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Accepted formats: PDF, DOC, DOCX (Max 10MB)
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="coverLetter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover Letter (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6 border-t">
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={submitMutation.isPending}
                      >
                        {submitMutation.isPending ? "Submitting Application..." : "Submit Application"}
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        By submitting this application, you agree to our privacy policy and terms of service.
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}