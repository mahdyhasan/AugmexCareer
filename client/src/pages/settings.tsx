import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Save, Key, Bot, Mail, Shield } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const settingsSchema = z.object({
  openaiApiKey: z.string().min(1, "OpenAI API key is required"),
  enableAiScreening: z.boolean(),
  companyName: z.string().min(1, "Company name is required"),
  companyEmail: z.string().email("Please enter a valid email"),
  companyWebsite: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  emailNotifications: z.boolean(),
  autoScreening: z.boolean(),
  screeningThreshold: z.number().min(0).max(100),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      openaiApiKey: "",
      enableAiScreening: true,
      companyName: "Augmex",
      companyEmail: "careers@augmex.io",
      companyWebsite: "https://augmex.io",
      emailNotifications: true,
      autoScreening: false,
      screeningThreshold: 70,
    },
  });

  const onSubmit = async (data: SettingsForm) => {
    setLoading(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600">Manage your job portal configuration</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* AI Configuration */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Bot className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">AI Configuration</CardTitle>
                  <p className="text-sm text-gray-600">Configure AI-powered resume screening</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="openaiApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        OpenAI API Key
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="sk-..."
                          className="font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your OpenAI API key for AI-powered resume analysis. This will be stored securely.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="enableAiScreening"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Enable AI Screening
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Automatically analyze resumes using AI when applications are submitted
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

                <FormField
                  control={form.control}
                  name="autoScreening"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Auto-advance High Scores
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Automatically move applications above threshold to "Screened" status
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

                <FormField
                  control={form.control}
                  name="screeningThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">AI Screening Threshold</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="w-20"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                          <span className="text-sm text-gray-600">points (0-100)</span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Applications scoring above this threshold will be auto-advanced
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                  <p className="text-sm text-gray-600">Update your company details</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Company Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://your-company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Settings</CardTitle>
                <p className="text-sm text-gray-600">Configure how you receive updates</p>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Email Notifications
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Receive email alerts for new applications and status changes
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
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Settings
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}