import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, TrendingUp, Users, FileText, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { ApplicationTable } from "@/components/ApplicationTable";
import { JobTable } from "@/components/JobTable";
import { CreateJobModal } from "@/components/CreateJobModal";
import { useAuth } from "@/hooks/useAuth";
import { DashboardStats, Application, JobWithApplications } from "@/types";
import augmexLogo from "@assets/augmex_logo_retina_1753883414771.png";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAdmin,
  });

  const { data: applicationsData } = useQuery<{ applications: Application[] }>({
    queryKey: ["/api/applications"],
    enabled: isAdmin,
  });

  const { data: jobsData, refetch: refetchJobs } = useQuery<{ jobs: JobWithApplications[] }>({
    queryKey: ["/api/jobs"],
    enabled: isAdmin,
  });

  const handleStatusUpdate = async (applicationId: string, status: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={augmexLogo} alt="Augmex" className="h-10" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Augmex HR Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your job postings and track applications</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateJob(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-md">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.activeJobs || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-md">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Applications</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.newApplications || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-md">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Interviews Scheduled</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.interviews || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-md">
                  <Bot className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">AI Screened</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.aiScreened || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Applications</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applicationsData?.applications && applicationsData.applications.length > 0 ? (
                  <ApplicationTable
                    applications={applicationsData.applications.slice(0, 5)}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No applications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Insights */}
          <div className="space-y-6">
            {/* Job Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Job Status Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Jobs</span>
                  <span className="text-sm font-semibold text-green-600">
                    {stats?.activeJobs || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Draft Jobs</span>
                  <span className="text-sm font-semibold text-gray-500">
                    {jobsData?.jobs.filter(job => job.status === 'draft').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paused Jobs</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {jobsData?.jobs.filter(job => job.status === 'paused').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Closed Jobs</span>
                  <span className="text-sm font-semibold text-gray-400">
                    {jobsData?.jobs.filter(job => job.status === 'closed').length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* AI Screening Insights */}
            <Card>
              <CardHeader>
                <CardTitle>AI Screening Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Match (80%+)</span>
                  <span className="text-sm font-semibold text-green-600">
                    {applicationsData?.applications.filter(app => (app.aiScore || 0) >= 80).length || 0} candidates
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium Match (60-79%)</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {applicationsData?.applications.filter(app => (app.aiScore || 0) >= 60 && (app.aiScore || 0) < 80).length || 0} candidates
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Match (&lt;60%)</span>
                  <span className="text-sm font-semibold text-gray-400">
                    {applicationsData?.applications.filter(app => (app.aiScore || 0) < 60 && app.aiScore !== null).length || 0} candidates
                  </span>
                </div>
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View AI Report
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">New application received</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Job post updated</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Interview scheduled</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job Management Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Active Job Postings</CardTitle>
              <Button onClick={() => setShowCreateJob(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Job
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobsData?.jobs && jobsData.jobs.length > 0 ? (
              <JobTable
                jobs={jobsData.jobs}
                onJobUpdate={refetchJobs}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No jobs posted yet</p>
                <Button 
                  className="mt-4"
                  onClick={() => setShowCreateJob(true)}
                >
                  Create Your First Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showCreateJob && (
        <CreateJobModal
          onClose={() => setShowCreateJob(false)}
        />
      )}
    </Layout>
  );
}
