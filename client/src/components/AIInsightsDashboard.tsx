import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Star,
  Target,
  Award,
  Clock
} from "lucide-react";

interface DashboardStats {
  totalApplications: number;
  aiAnalyzedApplications: number;
  averageAIScore: number;
  topCandidatesCount: number;
  duplicatesDetected: number;
  averageProcessingTime: number;
}

interface TopCandidate {
  id: string;
  name: string;
  position: string;
  score: number;
  status: string;
}

export function AIInsightsDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/ai-insights/stats'],
  });

  const { data: topCandidates, isLoading: candidatesLoading } = useQuery<{ candidates: TopCandidate[] }>({
    queryKey: ['/api/ai-insights/top-candidates'],
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-semibold">AI Insights Dashboard</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Analyzed</p>
                <p className="text-2xl font-semibold">{stats?.aiAnalyzedApplications || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                of {stats?.totalApplications || 0} total applications
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className={`text-2xl font-semibold ${getScoreColor(stats?.averageAIScore || 0)}`}>
                  {stats?.averageAIScore || 0}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress value={stats?.averageAIScore || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Candidates</p>
                <p className="text-2xl font-semibold text-green-600">{stats?.topCandidatesCount || 0}</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">Score ≥ 80</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Duplicates Found</p>
                <p className="text-2xl font-semibold text-orange-600">{stats?.duplicatesDetected || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">Potential matches detected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Candidates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Top AI-Ranked Candidates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {candidatesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : topCandidates?.candidates && topCandidates.candidates.length > 0 ? (
            <div className="space-y-4">
              {topCandidates.candidates.map((candidate, index) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium">{candidate.name}</h3>
                      <p className="text-sm text-gray-600">{candidate.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={candidate.status === 'hired' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {candidate.status}
                    </Badge>
                    <div className={`text-xl font-bold ${getScoreColor(candidate.score)}`}>
                      {candidate.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No candidates analyzed yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Excellent (80-100)</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">25%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Good (60-79)</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">45%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Needs Improvement (0-59)</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">30%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Processing Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Processing Time</span>
                <span className="font-medium">{stats?.averageProcessingTime || 0}s</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Success Rate</span>
                <span className="font-medium text-green-600">98.5%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Duplicate Detection</span>
                <span className="font-medium text-orange-600">
                  {stats?.duplicatesDetected || 0} found
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">AI Model Version</span>
                <span className="font-medium">GPT-4o</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}