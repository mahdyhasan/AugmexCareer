import OpenAI from "openai";
import { storage } from "../storage";
import type { Application } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EnhancedAIAnalysis {
  overallScore: number;
  skillsMatch: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  strengths: string[];
  weaknesses: string[];
  culturalFit: number; // 0-100
  technicalCompetency: number; // 0-100
  leadershipPotential: number; // 0-100
  recommendations: string;
  redFlags: string[];
  interviewQuestions: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: 'USD';
  };
  competencyBreakdown: {
    technical: number;
    communication: number;
    problemSolving: number;
    teamwork: number;
    adaptability: number;
  };
}

interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateApplicationIds: string[];
  confidence: number; // 0-100
  matchingFactors: string[];
}

interface CandidateRanking {
  applicationId: string;
  score: number;
  rank: number;
  matchPercentage: number;
  keyStrengths: string[];
  differentiators: string[];
}

export class EnhancedAIService {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  private readonly model = "gpt-4o";

  async performEnhancedAnalysis(
    resumeText: string,
    jobRequirements: string,
    jobTitle: string,
    companyDescription: string
  ): Promise<EnhancedAIAnalysis> {
    const prompt = `You are an expert AI recruiter analyzing a candidate's resume for a specific position. Provide a comprehensive analysis in JSON format.

JOB DETAILS:
Title: ${jobTitle}
Requirements: ${jobRequirements}
Company: ${companyDescription}

RESUME:
${resumeText}

Analyze the candidate and respond with JSON containing:
{
  "overallScore": number (0-100),
  "skillsMatch": ["skill1", "skill2"],
  "experienceLevel": "entry|mid|senior|lead|executive",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "culturalFit": number (0-100),
  "technicalCompetency": number (0-100),
  "leadershipPotential": number (0-100),
  "recommendations": "detailed recommendation",
  "redFlags": ["flag1", "flag2"],
  "interviewQuestions": ["question1", "question2"],
  "salaryRange": {"min": number, "max": number, "currency": "USD"},
  "competencyBreakdown": {
    "technical": number (0-100),
    "communication": number (0-100),
    "problemSolving": number (0-100),
    "teamwork": number (0-100),
    "adaptability": number (0-100)
  }
}

Focus on practical insights that help hiring decisions.`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content!);
      return analysis as EnhancedAIAnalysis;
    } catch (error) {
      console.error("Enhanced AI analysis failed:", error);
      throw new Error("Failed to perform enhanced AI analysis");
    }
  }

  async detectDuplicateApplications(
    candidateEmail: string,
    candidateName: string,
    candidatePhone?: string,
    resumeText?: string
  ): Promise<DuplicateDetectionResult> {
    try {
      // Get all existing applications
      const allApplications = await storage.getApplications();
      const potentialDuplicates: Application[] = [];

      // First pass: exact matches
      for (const app of allApplications) {
        if (app.candidateEmail.toLowerCase() === candidateEmail.toLowerCase()) {
          potentialDuplicates.push(app);
          continue;
        }
        
        if (candidatePhone && app.candidatePhone === candidatePhone) {
          potentialDuplicates.push(app);
          continue;
        }
        
        // Name similarity check
        if (this.calculateNameSimilarity(candidateName, app.candidateName) > 0.8) {
          potentialDuplicates.push(app);
        }
      }

      if (potentialDuplicates.length === 0) {
        return {
          isDuplicate: false,
          duplicateApplicationIds: [],
          confidence: 0,
          matchingFactors: []
        };
      }

      // Enhanced analysis using AI for ambiguous cases
      if (resumeText && potentialDuplicates.length > 0) {
        const aiAnalysis = await this.aiDuplicateAnalysis(
          { email: candidateEmail, name: candidateName, phone: candidatePhone, resumeText },
          potentialDuplicates
        );
        return aiAnalysis;
      }

      // Return basic duplicate detection result
      const matchingFactors = [];
      if (potentialDuplicates.some(app => app.candidateEmail.toLowerCase() === candidateEmail.toLowerCase())) {
        matchingFactors.push("Email match");
      }
      if (candidatePhone && potentialDuplicates.some(app => app.candidatePhone === candidatePhone)) {
        matchingFactors.push("Phone match");
      }

      return {
        isDuplicate: true,
        duplicateApplicationIds: potentialDuplicates.map(app => app.id),
        confidence: 95,
        matchingFactors
      };
    } catch (error) {
      console.error("Duplicate detection failed:", error);
      return {
        isDuplicate: false,
        duplicateApplicationIds: [],
        confidence: 0,
        matchingFactors: []
      };
    }
  }

  async rankCandidatesForJob(jobId: string): Promise<CandidateRanking[]> {
    try {
      const applications = await storage.getApplications(jobId);
      const job = await storage.getJob(jobId);
      
      if (!job || applications.length === 0) {
        return [];
      }

      const rankings: CandidateRanking[] = [];

      for (const app of applications) {
        if (!app.aiAnalysis || !app.aiScore) {
          continue;
        }

        const analysis = app.aiAnalysis as any;
        
        // Calculate comprehensive score
        const technicalWeight = 0.4;
        const experienceWeight = 0.3;
        const culturalWeight = 0.2;
        const leadershipWeight = 0.1;
        
        const technicalScore = analysis.technicalCompetency || app.aiScore;
        const experienceScore = this.mapExperienceToScore(analysis.experienceLevel);
        const culturalScore = analysis.culturalFit || 70;
        const leadershipScore = analysis.leadershipPotential || 50;
        
        const compositeScore = 
          (technicalScore * technicalWeight) +
          (experienceScore * experienceWeight) +
          (culturalScore * culturalWeight) +
          (leadershipScore * leadershipWeight);

        rankings.push({
          applicationId: app.id,
          score: Math.round(compositeScore),
          rank: 0, // Will be set after sorting
          matchPercentage: Math.round((compositeScore / 100) * 100),
          keyStrengths: analysis.strengths || [],
          differentiators: this.extractDifferentiators(analysis)
        });
      }

      // Sort by score and assign ranks
      rankings.sort((a, b) => b.score - a.score);
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
      });

      return rankings;
    } catch (error) {
      console.error("Candidate ranking failed:", error);
      return [];
    }
  }

  async generateInterviewQuestions(
    jobTitle: string,
    jobRequirements: string,
    candidateStrengths: string[],
    candidateWeaknesses: string[]
  ): Promise<string[]> {
    const prompt = `Generate 8-10 targeted interview questions for a ${jobTitle} position.

Job Requirements: ${jobRequirements}
Candidate Strengths: ${candidateStrengths.join(", ")}
Candidate Weaknesses: ${candidateWeaknesses.join(", ")}

Create questions that:
1. Assess technical competency
2. Explore strengths mentioned
3. Address potential weaknesses
4. Evaluate cultural fit
5. Test problem-solving abilities

Return as JSON array: ["question1", "question2", ...]`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result.questions || [];
    } catch (error) {
      console.error("Interview question generation failed:", error);
      return [];
    }
  }

  private async aiDuplicateAnalysis(
    candidate: { email: string; name: string; phone?: string; resumeText: string },
    potentialDuplicates: Application[]
  ): Promise<DuplicateDetectionResult> {
    const prompt = `Analyze if this candidate is a duplicate of existing applications.

NEW CANDIDATE:
Email: ${candidate.email}
Name: ${candidate.name}
Phone: ${candidate.phone || 'N/A'}
Resume snippet: ${candidate.resumeText.substring(0, 500)}...

EXISTING APPLICATIONS:
${potentialDuplicates.map((app, i) => `
${i + 1}. Email: ${app.candidateEmail}
   Name: ${app.candidateName}
   Phone: ${app.candidatePhone || 'N/A'}
   Current Company: ${app.currentCompany || 'N/A'}
`).join('\n')}

Respond with JSON:
{
  "isDuplicate": boolean,
  "duplicateApplicationIds": ["id1", "id2"],
  "confidence": number (0-100),
  "matchingFactors": ["factor1", "factor2"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      return JSON.parse(response.choices[0].message.content!);
    } catch (error) {
      console.error("AI duplicate analysis failed:", error);
      return {
        isDuplicate: false,
        duplicateApplicationIds: [],
        confidence: 0,
        matchingFactors: []
      };
    }
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    
    if (n1 === n2) return 1.0;
    
    // Simple Levenshtein distance ratio
    const maxLen = Math.max(n1.length, n2.length);
    const distance = this.levenshteinDistance(n1, n2);
    return 1 - (distance / maxLen);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private mapExperienceToScore(level: string): number {
    const mapping: Record<string, number> = {
      'entry': 60,
      'mid': 75,
      'senior': 85,
      'lead': 90,
      'executive': 95
    };
    return mapping[level] || 70;
  }

  private extractDifferentiators(analysis: any): string[] {
    const differentiators = [];
    
    if (analysis.leadershipPotential > 80) {
      differentiators.push("Strong leadership potential");
    }
    
    if (analysis.technicalCompetency > 90) {
      differentiators.push("Exceptional technical skills");
    }
    
    if (analysis.culturalFit > 85) {
      differentiators.push("Excellent cultural fit");
    }
    
    if (analysis.competencyBreakdown?.problemSolving > 85) {
      differentiators.push("Outstanding problem-solving abilities");
    }
    
    return differentiators;
  }
}

export const enhancedAI = new EnhancedAIService();