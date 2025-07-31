import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, CheckCircle, Upload, User, Mail, Phone, MapPin, Building, Clock } from "lucide-react";
import { Link } from "wouter";
import augmexLogo from "@assets/augmex_logo_retina_1753883414771.png";

// General application form schema
const generalApplicationSchema = z.object({
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
  preferredPositions: z.string().min(1, "Please specify your preferred positions or departments"),
  coverLetter: z.string().min(50, "Please write at least 50 characters about yourself"),
  resume: z.instanceof(File).optional(),
});

type GeneralApplicationForm = z.infer<typeof generalApplicationSchema>;

export default function GeneralApplyPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const form = useForm<GeneralApplicationForm>({
    resolver: zodResolver(generalApplicationSchema),
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
      preferredPositions: "",
      coverLetter: "",
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: GeneralApplicationForm) => {
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'resume' && value) {
          formData.append(key, value);
        }
      });

      // Add resume file if provided
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      // For general applications, we'll use a special jobId
      formData.append('jobId', 'general-application');
      formData.append('jobTitle', 'General Application');

      const response = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit application");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you for your interest. We'll review your application and contact you if there's a suitable opportunity.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GeneralApplicationForm) => {
    submitApplicationMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.includes('pdf') && !file.type.includes('doc')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document",
          variant: "destructive",
        });
        return;
      }
      
      setResumeFile(file);
      form.setValue('resume', file);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/">
                <div className="flex items-center space-x-3 cursor-pointer">
                  <img src={augmexLogo} alt="Augmex" className="h-8 w-auto" />
                  <div>
                    <span className="text-xl font-bold text-gray-900">Augmex</span>
                    <span className="text-sm text-gray-500 ml-2">Careers</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Success Message */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="text-center">
            <CardContent className="py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Application Submitted Successfully!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Thank you for your interest in joining Augmex. We've received your general application 
                and will review it carefully. If we find a suitable position that matches your skills 
                and experience, we'll reach out to you.
              </p>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>What's next?</strong> Our HR team will review your application within 5-7 business days. 
                    We'll keep your information on file for future opportunities that match your profile.
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Link href="/jobs">
                    <Button variant="outline">
                      View Open Positions
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button>
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <img src={augmexLogo} alt="Augmex" className="h-8 w-auto" />
                <div>
                  <span className="text-xl font-bold text-gray-900">Augmex</span>
                  <span className="text-sm text-gray-500 ml-2">Careers</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Link href="/jobs">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submit General Application
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Don't see a specific position that fits? Submit a general application and we'll consider you for future opportunities that match your profile.
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
                              <FormLabel>Location *</FormLabel>
                              <FormControl>
                                <Input placeholder="San Francisco, CA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Professional Experience */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Professional Experience</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="currentCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Company *</FormLabel>
                              <FormControl>
                                <Input placeholder="Tech Corp Inc." {...field} />
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
                                <Input placeholder="Software Engineer" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="timeWithCurrentCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time with Current Company *</FormLabel>
                              <FormControl>
                                <Input placeholder="2 years" {...field} />
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

                      <FormField
                        control={form.control}
                        name="preferredPositions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Positions/Departments *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Software Engineering, Product Management, Marketing, etc." 
                                className="resize-none" 
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Online Profiles */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Online Profiles</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="linkedinProfile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn Profile</FormLabel>
                              <FormControl>
                                <Input placeholder="https://linkedin.com/in/your-profile" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gitProfile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GitHub/Portfolio</FormLabel>
                              <FormControl>
                                <Input placeholder="https://github.com/your-username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Resume Upload */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Resume</h3>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {resumeFile ? resumeFile.name : "Upload your resume (PDF or Word document)"}
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                            id="resume-upload"
                          />
                          <label htmlFor="resume-upload">
                            <Button type="button" variant="outline" className="cursor-pointer" asChild>
                              <span>Choose File</span>
                            </Button>
                          </label>
                          <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">About You</h3>
                      
                      <FormField
                        control={form.control}
                        name="coverLetter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tell us about yourself *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your background, what you're passionate about, and what kind of opportunities interest you at Augmex..." 
                                className="resize-none" 
                                rows={6}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={submitApplicationMutation.isPending}
                    >
                      {submitApplicationMutation.isPending ? "Submitting..." : "Submit General Application"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Why Augmex?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">500+ talented team members</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Remote-first culture</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">Award-winning workplace</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm">Flexible working hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What to Expect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600">
                  <p>
                    Our HR team reviews all general applications carefully. We'll keep your 
                    information on file and reach out when suitable positions become available.
                  </p>
                  <p>
                    Response time: 5-7 business days for initial review.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}