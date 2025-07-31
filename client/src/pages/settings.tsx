import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Save, Key, Mail, Bell, Shield, Database, TestTube, CheckCircle } from "lucide-react";

const openaiSettingsSchema = z.object({
  apiKey: z.string().min(1, "OpenAI API key is required"),
  model: z.string().default("gpt-4o"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(1000),
  enableAutoScreening: z.boolean().default(true),
  screeningPrompt: z.string().min(1, "Screening prompt is required"),
});

const emailSettingsSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().min(1).max(65535, "Port must be between 1 and 65535"),
  secure: z.boolean().default(true),
  testEmail: z.string().email("Please enter a valid test email").optional(),
});

type OpenAISettingsForm = z.infer<typeof openaiSettingsSchema>;
type EmailSettingsForm = z.infer<typeof emailSettingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Email form
  const emailForm = useForm<EmailSettingsForm>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      email: "",
      password: "",
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      testEmail: "",
    },
  });

  // OpenAI form
  const openaiForm = useForm<OpenAISettingsForm>({
    resolver: zodResolver(openaiSettingsSchema),
    defaultValues: {
      apiKey: "",
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 1000,
      enableAutoScreening: true,
      screeningPrompt: `Analyze this resume against the job requirements and provide:
1. Overall match score (0-100)
2. Key skills that match the job requirements
3. Experience level assessment
4. Top 3 strengths of the candidate
5. Recommendation (hire/interview/reject) with brief reasoning

Please be objective and focus on technical qualifications and relevant experience.`,
    },
  });

  // Fetch email configuration
  const { data: emailConfig, isLoading: loadingEmailConfig } = useQuery({
    queryKey: ['/api/settings/email'],
  });

  // Update email form when config loads
  useEffect(() => {
    if (emailConfig && emailConfig.configured) {
      emailForm.reset({
        email: emailConfig.email || "",
        password: "", // Don't pre-fill password for security
        host: emailConfig.host || "smtp.zoho.com",
        port: emailConfig.port || 465,
        secure: emailConfig.secure !== false,
        testEmail: "",
      });
    }
  }, [emailConfig, emailForm]);

  // Save email configuration
  const saveEmailMutation = useMutation({
    mutationFn: async (data: EmailSettingsForm) => {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save email config');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/email'] });
      toast({
        title: "Email Configuration Saved",
        description: "Your Zoho mail settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save email configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Test email configuration
  const testEmailMutation = useMutation({
    mutationFn: async (testEmail: string) => {
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send test email');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent!",
        description: "Check your inbox to confirm the email configuration is working.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Email Failed",
        description: error.message || "Failed to send test email. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  const onEmailSubmit = async (data: EmailSettingsForm) => {
    await saveEmailMutation.mutateAsync(data);
  };

  const onTestEmail = async () => {
    const testEmail = emailForm.getValues("testEmail");
    if (!testEmail) {
      toast({
        title: "Test Email Required",
        description: "Please enter a test email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsTestingEmail(true);
    try {
      await testEmailMutation.mutateAsync(testEmail);
    } catch (error) {
      console.error("Test email error:", error);
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">Configure your job portal settings and integrations</p>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Configuration
            </TabsTrigger>
            <TabsTrigger value="openai" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              AI Settings
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          {/* Email Configuration Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Zoho Mail Configuration
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Configure your Zoho mail account to send application confirmations and notifications.
                </p>
                {emailConfig?.configured && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Email is configured and ready
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={emailForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="your-email@zoho.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Your Zoho email address
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Your Zoho password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Your Zoho email password
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={emailForm.control}
                        name="host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="smtp.zoho.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="465" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 465)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="secure"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>SSL/TLS</FormLabel>
                              <FormDescription className="text-xs">
                                Use secure connection
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Test Email Section */}
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Test Configuration</h4>
                      <div className="flex gap-3">
                        <FormField
                          control={emailForm.control}
                          name="testEmail"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="test@example.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Enter an email address to test the configuration
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onTestEmail}
                          disabled={isTestingEmail || !emailConfig?.configured}
                          className="self-start"
                        >
                          {isTestingEmail ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                              Sending...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TestTube className="h-4 w-4" />
                              Send Test
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={saveEmailMutation.isPending}
                        className="min-w-[120px]"
                      >
                        {saveEmailMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Configuration
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OpenAI Settings Tab */}
          <TabsContent value="openai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-600" />
                  AI Resume Screening
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Configure OpenAI integration for automated resume analysis and candidate screening.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...openaiForm}>
                  <form className="space-y-6">
                    <FormField
                      control={openaiForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OpenAI API Key *</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="sk-..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Your OpenAI API key for resume analysis
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={openaiForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={openaiForm.control}
                        name="enableAutoScreening"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Auto Screening</FormLabel>
                              <FormDescription className="text-xs">
                                Automatically analyze resumes
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={openaiForm.control}
                      name="screeningPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Screening Prompt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter the prompt for AI resume analysis..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This prompt will be used to analyze resumes with AI
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button className="min-w-[120px]">
                        <Save className="h-4 w-4 mr-2" />
                        Save AI Settings
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  General Settings
                </CardTitle>
                <p className="text-sm text-gray-600">
                  General application preferences and configurations.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input value="Augmex" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Career Email</Label>
                      <Input value="career@augmex.io" disabled />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Application Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Duplicate Application Prevention</Label>
                        <p className="text-sm text-gray-600">Prevent candidates from applying multiple times</p>
                      </div>
                      <Switch checked={true} disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-600">Send notifications for new applications</p>
                      </div>
                      <Switch checked={true} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="min-w-[120px]">
                    <Save className="h-4 w-4 mr-2" />
                    Save General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}