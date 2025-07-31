import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Trophy,
  Zap,
  RefreshCw
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnhancedAnalysis {
  overallScore: number;
  skillsMatch: string[];
  experienceLevel: string;
  strengths: string[];
  weaknesses: string[];
  culturalFit: number;
  technicalCompetency: number;
  leadershipPotential: number;
  recommendations: string;
  redFlags: string[];
  interviewQuestions: string[];
  salaryRange: { min: number; max: number; currency: string };
  competencyBreakdown: {
    technical: number;
    communication: number;
    problemSolving: number;
    teamwork: number;
    adaptability: number;
  };
}

interface CandidateRanking {
  applicationId: string;
  score: number;
  rank: number;
  matchPercentage: number;
  keyStrengths: string[];
  differentiators: string[];
}

interface DuplicateCheck {
  isDuplicate: boolean;
  duplicateApplicationIds: string[];
  confidence: number;
  matchingFactors: string[];
}

interface EnhancedAIPanelProps {
  applicationId: string;
  jobId: string;
}

export function EnhancedAIPanel({ applicationId, jobId }: EnhancedAIPanelProps) {
  const [activeTab, setActiveTab] = useState("analysis");
  const { toast } = useToast();

  // Enhanced analysis query
  const { data: enhancedAnalysis, isLoading: analysisLoading } = useQuery<EnhancedAnalysis>({
    queryKey: ['/api/applications', applicationId, 'enhanced-analysis'],
    enabled: !!applicationId,
  });

  // Candidate rankings query
  const { data: candidateRankings, isLoading: rankingsLoading } = useQuery<{ rankings: CandidateRanking[] }>({
    queryKey: ['/api/jobs', jobId, 'candidate-rankings'],
    enabled: !!jobId,
  });

  // Duplicate check query
  const { data: duplicateCheck, isLoading: duplicateLoading } = useQuery<DuplicateCheck>({
    queryKey: ['/api/applications', applicationId, 'duplicate-check'],
    enabled: !!applicationId,
  });

  // Re-analyze mutation
  const reAnalyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}/reanalyze`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Re-analysis failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId] });
      toast({
        title: "Analysis Updated",
        description: "Enhanced AI analysis has been refreshed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to re-analyze application.",
        variant: "destructive",
      });
    },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Enhanced AI Analysis</h2>
        </div>
        <Button
          onClick={() => reAnalyzeMutation.mutate()}
          disabled={reAnalyzeMutation.isPending}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${reAnalyzeMutation.isPending ? 'animate-spin' : ''}`} />
          Re-analyze
        </Button>
      </div>

      {/* Duplicate Alert */}
      {duplicateCheck?.isDuplicate && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Potential Duplicate Detected</strong> - {duplicateCheck.confidence}% confidence
            <div className="mt-1 text-sm">
              Matching factors: {duplicateCheck.matchingFactors.join(", ")}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {analysisLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : enhancedAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Overall Score */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className={`text-3xl font-bold ${getScoreColor(enhancedAnalysis.overallScore)}`}>
                      {enhancedAnalysis.overallScore}
                    </span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(enhancedAnalysis.overallScore)} ${getScoreColor(enhancedAnalysis.overallScore)}`}>
                      {enhancedAnalysis.experienceLevel}
                    </div>
                  </div>
                  <Progress value={enhancedAnalysis.overallScore} className="mt-2" />
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cultural Fit</span>
                    <span className={`font-medium ${getScoreColor(enhancedAnalysis.culturalFit)}`}>
                      {enhancedAnalysis.culturalFit}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Technical</span>
                    <span className={`font-medium ${getScoreColor(enhancedAnalysis.technicalCompetency)}`}>
                      {enhancedAnalysis.technicalCompetency}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Leadership</span>
                    <span className={`font-medium ${getScoreColor(enhancedAnalysis.leadershipPotential)}`}>
                      {enhancedAnalysis.leadershipPotential}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {enhancedAnalysis.strengths?.map((strength, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Red Flags */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Red Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {enhancedAnalysis.redFlags && enhancedAnalysis.redFlags.length > 0 ? (
                    <div className="space-y-1">
                      {enhancedAnalysis.redFlags?.map((flag, index) => (
                        <div key={index} className="text-sm text-red-600 flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                          {flag}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No red flags identified</p>
                  )}
                </CardContent>
              </Card>

              {/* Salary Range */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Salary Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        ${enhancedAnalysis.salaryRange?.min?.toLocaleString() || 'N/A'} - ${enhancedAnalysis.salaryRange?.max?.toLocaleString() || 'N/A'}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">Based on experience and market data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {enhancedAnalysis.recommendations}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No enhanced analysis available
            </div>
          )}
        </TabsContent>

        <TabsContent value="competencies" className="space-y-4">
          {enhancedAnalysis?.competencyBreakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(enhancedAnalysis.competencyBreakdown).map(([skill, score]) => (
                <Card key={skill}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium capitalize">{skill}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="interview" className="space-y-4">
          {enhancedAnalysis?.interviewQuestions && enhancedAnalysis.interviewQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Suggested Interview Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {enhancedAnalysis.interviewQuestions.map((question, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{question}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          {rankingsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : candidateRankings?.rankings && candidateRankings.rankings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Candidate Rankings for this Job
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidateRankings.rankings.map((ranking) => (
                    <div 
                      key={ranking.applicationId} 
                      className={`p-3 rounded-lg border ${
                        ranking.applicationId === applicationId 
                          ? 'border-purple-200 bg-purple-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            ranking.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            #{ranking.rank}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {ranking.applicationId === applicationId ? 'This Candidate' : `Candidate ${ranking.rank}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {ranking.matchPercentage}% match
                            </div>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${getScoreColor(ranking.score)}`}>
                          {ranking.score}
                        </div>
                      </div>
                      
                      {ranking.keyStrengths.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ranking.keyStrengths.slice(0, 3).map((strength, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No ranking data available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}