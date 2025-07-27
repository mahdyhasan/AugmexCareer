import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_FALLBACK || "default_key"
});

export interface ResumeAnalysis {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  highlights: string[];
  concerns: string[];
  recommendation: 'hire' | 'interview' | 'reject';
}

export async function analyzeResume(
  resumeText: string, 
  jobDescription: string, 
  jobRequirements: string
): Promise<ResumeAnalysis> {
  try {
    const prompt = `
    You are an expert HR recruiter analyzing a resume against a job posting. 
    
    Job Description: ${jobDescription}
    
    Job Requirements: ${jobRequirements}
    
    Resume Content: ${resumeText}
    
    Please analyze this resume and provide a detailed assessment in JSON format with the following structure:
    {
      "overallScore": number (0-100),
      "skillsMatch": number (0-100),
      "experienceMatch": number (0-100),
      "educationMatch": number (0-100),
      "highlights": ["string array of positive points"],
      "concerns": ["string array of potential concerns"],
      "recommendation": "hire" | "interview" | "reject"
    }
    
    Scoring guidelines:
    - Overall score should reflect how well the candidate matches the role
    - Skills match: How well their technical skills align with requirements
    - Experience match: Relevance and level of their work experience
    - Education match: How their educational background fits
    - Highlights: 3-5 strongest points about the candidate
    - Concerns: Any potential red flags or gaps
    - Recommendation: Based on overall assessment
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert HR recruiter. Analyze resumes objectively and provide detailed, actionable feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      overallScore: Math.max(0, Math.min(100, analysis.overallScore || 0)),
      skillsMatch: Math.max(0, Math.min(100, analysis.skillsMatch || 0)),
      experienceMatch: Math.max(0, Math.min(100, analysis.experienceMatch || 0)),
      educationMatch: Math.max(0, Math.min(100, analysis.educationMatch || 0)),
      highlights: analysis.highlights || [],
      concerns: analysis.concerns || [],
      recommendation: analysis.recommendation || 'reject',
    };
  } catch (error) {
    console.error("Failed to analyze resume:", error);
    throw new Error("Failed to analyze resume with AI");
  }
}

export async function extractResumeText(resumeContent: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Extract and clean text content from resume data. Return only the readable text content without formatting."
        },
        {
          role: "user",
          content: `Extract the text content from this resume: ${resumeContent}`
        }
      ],
      temperature: 0,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Failed to extract resume text:", error);
    throw new Error("Failed to extract resume text");
  }
}
