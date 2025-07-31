import { useState } from "react";
import { Bell, Mail, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface JobAlert {
  id: string;
  email: string;
  keywords?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  isActive: boolean;
  createdAt: string;
}

interface JobAlertsSubscriptionProps {
  userEmail?: string;
}

export function JobAlertsSubscription({ userEmail }: JobAlertsSubscriptionProps) {
  const [email, setEmail] = useState(userEmail || '');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing alerts for the email
  const { data: alerts = [] } = useQuery({
    queryKey: ['/api/job-alerts', email],
    enabled: !!email,
  });

  // Create job alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: any) => {
      const response = await fetch('/api/job-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create job alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job alert created",
        description: "You'll receive email notifications for matching jobs.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-alerts', email] });
      
      // Reset form
      setKeywords('');
      setLocation('');
      setEmploymentType('');
      setExperienceLevel('');
    },
    onError: () => {
      toast({
        title: "Failed to create job alert",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Deactivate job alert mutation
  const deactivateAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/job-alerts/${alertId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to deactivate job alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job alert removed",
        description: "You won't receive notifications for this alert anymore.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-alerts', email] });
    },
    onError: () => {
      toast({
        title: "Failed to remove job alert",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const alertData = {
      email,
      keywords: keywords.trim() || null,
      location: location.trim() === 'any' ? null : location.trim() || null,
      employmentType: employmentType === 'any' ? null : employmentType || null,
      experienceLevel: experienceLevel === 'any' ? null : experienceLevel || null,
    };

    createAlertMutation.mutate(alertData);
  };

  const handleDeactivateAlert = (alertId: string) => {
    deactivateAlertMutation.mutate(alertId);
  };

  return (
    <div className="space-y-6">
      {/* Create New Job Alert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Create Job Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Keywords
              </label>
              <Textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., React, Node.js, JavaScript, Frontend Developer"
                rows={2}
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate multiple keywords with commas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Employment Type
                </label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Experience Level
                </label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any level</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={createAlertMutation.isPending}
            >
              {createAlertMutation.isPending ? (
                "Creating Alert..."
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Create Job Alert
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Job Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Job Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert: JobAlert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">{alert.email}</span>
                      {alert.isActive ? (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {alert.keywords && (
                        <span>Keywords: {alert.keywords} • </span>
                      )}
                      {alert.location && (
                        <span>Location: {alert.location} • </span>
                      )}
                      {alert.employmentType && (
                        <span>Type: {alert.employmentType} • </span>
                      )}
                      {alert.experienceLevel && (
                        <span>Level: {alert.experienceLevel}</span>
                      )}
                      {!alert.keywords && !alert.location && !alert.employmentType && !alert.experienceLevel && (
                        <span>All jobs</span>
                      )}
                    </div>
                  </div>
                  
                  {alert.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivateAlert(alert.id)}
                      disabled={deactivateAlertMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}