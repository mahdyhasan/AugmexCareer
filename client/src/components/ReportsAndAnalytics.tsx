import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Download,
  Filter,
  Calendar,
  PieChart,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportMetrics {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  applicationsByMonth: { month: string; count: number }[];
  averageTimeToHire: number;
  topPerformingJobs: { jobTitle: string; applicationCount: number }[];
  conversionRates: {
    appliedToScreened: number;
    screenedToInterviewed: number;
    interviewedToHired: number;
  };
  averageAIScore: number;
  diversityMetrics: {
    experienceLevels: Record<string, number>;
    locations: Record<string, number>;
  };
}

interface HiringFunnelReport {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  stages: {
    applied: number;
    screened: number;
    interviewed: number;
    offer: number;
    hired: number;
    rejected: number;
  };
  conversionRates: {
    screeningRate: number;
    interviewRate: number;
    offerRate: number;
    hireRate: number;
  };
  averageTimeInStage: Record<string, number>;
  topCandidates: {
    name: string;
    email: string;
    aiScore: number;
    status: string;
  }[];
}

export function ReportsAndAnalytics() {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  // Overall metrics query
  const { data: overallMetrics, isLoading: metricsLoading } = useQuery<ReportMetrics>({
    queryKey: ['/api/reports/metrics'],
  });

  // Jobs list for filtering
  const { data: jobsData } = useQuery<{ jobs: any[] }>({
    queryKey: ['/api/jobs'],
  });

  // Hiring funnel report
  const { data: funnelReport, isLoading: funnelLoading } = useQuery<HiringFunnelReport>({
    queryKey: ['/api/reports/hiring-funnel', selectedJob],
    enabled: !!selectedJob,
  });

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/reports/export/csv');
      if (!response.ok) throw new Error('Export failed');
      
      const csvData = await response.text();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Applications data has been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export applications data.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-800',
      screened: 'bg-yellow-100 text-yellow-800',
      interviewed: 'bg-purple-100 text-purple-800',
      offer: 'bg-orange-100 text-orange-800',
      hired: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (metricsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive hiring insights and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Hiring Funnel</TabsTrigger>
          <TabsTrigger value="diversity">Diversity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Applications</p>
                    <p className="text-2xl font-semibold">{overallMetrics?.totalApplications || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Time to Hire</p>
                    <p className="text-2xl font-semibold">{overallMetrics?.averageTimeToHire || 0} days</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. AI Score</p>
                    <p className="text-2xl font-semibold">{overallMetrics?.averageAIScore || 0}</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-semibold">
                      {overallMetrics?.conversionRates.appliedToScreened || 0}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications by Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Applications by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overallMetrics?.applicationsByStatus && 
                    Object.entries(overallMetrics.applicationsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(status)} variant="secondary">
                            {status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress 
                              value={(count / (overallMetrics.totalApplications || 1)) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Performing Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overallMetrics?.topPerformingJobs?.slice(0, 5).map((job, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm truncate max-w-48">{job.jobTitle}</span>
                      </div>
                      <span className="text-sm font-medium">{job.applicationCount} apps</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Conversion Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {overallMetrics?.conversionRates.appliedToScreened || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Applied → Screened</div>
                  <Progress value={overallMetrics?.conversionRates.appliedToScreened || 0} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {overallMetrics?.conversionRates.screenedToInterviewed || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Screened → Interviewed</div>
                  <Progress value={overallMetrics?.conversionRates.screenedToInterviewed || 0} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {overallMetrics?.conversionRates.interviewedToHired || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Interviewed → Hired</div>
                  <Progress value={overallMetrics?.conversionRates.interviewedToHired || 0} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a job to analyze" />
              </SelectTrigger>
              <SelectContent>
                {jobsData?.jobs?.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {funnelReport && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{funnelReport.jobTitle} - Hiring Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {Object.entries(funnelReport.stages).map(([stage, count]) => (
                      <div key={stage} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-600 capitalize">{stage}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round((count / funnelReport.totalApplications) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Rates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(funnelReport.conversionRates).map(([rate, value]) => (
                      <div key={rate}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{rate.replace(/([A-Z])/g, ' $1')}</span>
                          <span>{value}%</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Candidates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {funnelReport.topCandidates.map((candidate, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium text-sm">{candidate.name}</div>
                            <div className="text-xs text-gray-500">{candidate.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(candidate.status)}>
                              {candidate.status}
                            </Badge>
                            <span className="text-sm font-bold">{candidate.aiScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="diversity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Experience Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overallMetrics?.diversityMetrics.experienceLevels &&
                    Object.entries(overallMetrics.diversityMetrics.experienceLevels).map(([level, count]) => (
                      <div key={level} className="flex justify-between items-center">
                        <span className="text-sm">{level}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress 
                              value={(count / (overallMetrics.totalApplications || 1)) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overallMetrics?.diversityMetrics.locations &&
                    Object.entries(overallMetrics.diversityMetrics.locations).map(([location, count]) => (
                      <div key={location} className="flex justify-between items-center">
                        <span className="text-sm truncate max-w-32">{location}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress 
                              value={(count / (overallMetrics.totalApplications || 1)) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Application Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overallMetrics?.applicationsByMonth?.map((data) => (
                  <div key={data.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{data.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <Progress 
                          value={(data.count / Math.max(...(overallMetrics.applicationsByMonth?.map(d => d.count) || [1]))) * 100}
                          className="h-2" 
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{data.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}