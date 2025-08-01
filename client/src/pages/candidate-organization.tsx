import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateTags } from "@/components/CandidateTags";
import { CandidateShortlists } from "@/components/CandidateShortlists";
import { Tags, Bookmark, Star, Users } from "lucide-react";

export default function CandidateOrganization() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Candidate Organization</h1>
          <p className="text-sm text-gray-600">Organize and manage candidates with tags, ratings, and shortlists</p>
        </div>

        <Tabs defaultValue="tags" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Candidate Tags
            </TabsTrigger>
            <TabsTrigger value="shortlists" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Shortlists
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  Candidate Tags Management
                </CardTitle>
                <CardDescription>
                  Create and manage tags to categorize and organize candidates. Tags help you quickly identify candidate types and skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CandidateTags showCreateForm={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shortlists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5" />
                  Candidate Shortlists
                </CardTitle>
                <CardDescription>
                  Create and manage shortlists to group promising candidates. You can create job-specific shortlists or general talent pools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CandidateShortlists showCreateForm={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
                  <Tags className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Active candidate tags
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Shortlists</CardTitle>
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Active shortlists
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Shortlisted Candidates</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Candidates in shortlists
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rated Applications</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Applications with ratings
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Here's how to make the most of candidate organization tools:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Tags className="h-4 w-4 text-blue-600" />
                      Candidate Tags
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Create tags for skills (e.g., "React", "Python", "Leadership")</li>
                      <li>• Use color coding for easy visual identification</li>
                      <li>• Apply tags to applications for quick filtering</li>
                      <li>• Tags help identify candidate strengths at a glance</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-green-600" />
                      Shortlists
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Group promising candidates for specific roles</li>
                      <li>• Create general talent pools for future opportunities</li>
                      <li>• Add notes when shortlisting candidates</li>
                      <li>• Mark default shortlists for quick access</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
                  <p className="text-sm text-blue-800">
                    Navigate to the Applications Management page to apply tags, ratings, and shortlist candidates directly from their application details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}