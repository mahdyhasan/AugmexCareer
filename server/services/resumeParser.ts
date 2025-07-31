import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define types for parsed resume data
export interface ParsedResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    githubUrl?: string;
  };
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear?: string;
  }>;
  skills: string[];
  summary?: string;
  totalExperience?: string;
}

// Form data type for auto-fill
export interface AutoFillFormData {
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  location?: string;
  linkedinProfile?: string;
  gitProfile?: string;
  currentCompany?: string;
  currentRole?: string;
  timeWithCurrentCompany?: string;
  yearsOfExperience?: string;
  coverLetter?: string;
}

export class ResumeParserService {
  
  // Parse resume text using AI
  async parseResumeText(resumeText: string): Promise<ParsedResumeData> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a resume parsing expert. Extract structured information from the resume text and return it as JSON. 
            
            Return the data in this exact format:
            {
              "personalInfo": {
                "name": "Full Name",
                "email": "email@example.com",
                "phone": "+1-xxx-xxx-xxxx",
                "location": "City, State/Country",
                "linkedinUrl": "linkedin.com/in/profile",
                "githubUrl": "github.com/username"
              },
              "experience": [
                {
                  "company": "Company Name",
                  "role": "Job Title",
                  "duration": "Start Date - End Date or Present",
                  "description": "Brief description of responsibilities"
                }
              ],
              "education": [
                {
                  "institution": "University/School Name",
                  "degree": "Degree Type",
                  "fieldOfStudy": "Major/Field",
                  "graduationYear": "Year"
                }
              ],
              "skills": ["skill1", "skill2", "skill3"],
              "summary": "Professional summary or objective",
              "totalExperience": "X years"
            }
            
            If any field is not found, omit it or set it to null. Be accurate and extract only information that is clearly stated in the resume.`
          },
          {
            role: "user",
            content: resumeText
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const parsedContent = response.choices[0].message.content;
      if (!parsedContent) {
        throw new Error("No content returned from AI");
      }

      const parsedData = JSON.parse(parsedContent) as ParsedResumeData;
      return parsedData;

    } catch (error) {
      console.error("Resume parsing error:", error);
      throw new Error("Failed to parse resume with AI");
    }
  }

  // Generate form data for auto-fill from parsed resume data
  generateFormData(parsedData: ParsedResumeData): AutoFillFormData {
    const formData: AutoFillFormData = {};

    // Personal information
    if (parsedData.personalInfo?.name) {
      formData.candidateName = parsedData.personalInfo.name;
    }
    if (parsedData.personalInfo?.email) {
      formData.candidateEmail = parsedData.personalInfo.email;
    }
    if (parsedData.personalInfo?.phone) {
      formData.candidatePhone = parsedData.personalInfo.phone;
    }
    if (parsedData.personalInfo?.location) {
      formData.location = parsedData.personalInfo.location;
    }
    if (parsedData.personalInfo?.linkedinUrl) {
      formData.linkedinProfile = parsedData.personalInfo.linkedinUrl;
    }
    if (parsedData.personalInfo?.githubUrl) {
      formData.gitProfile = parsedData.personalInfo.githubUrl;
    }

    // Current job information (from most recent experience)
    if (parsedData.experience && parsedData.experience.length > 0) {
      const currentJob = parsedData.experience[0];
      formData.currentCompany = currentJob.company;
      formData.currentRole = currentJob.role;
      formData.timeWithCurrentCompany = currentJob.duration;
    }

    // Total experience
    if (parsedData.totalExperience) {
      formData.yearsOfExperience = parsedData.totalExperience;
    }

    // Cover letter from summary
    if (parsedData.summary) {
      formData.coverLetter = parsedData.summary;
    }

    return formData;
  }

  // Extract key skills for job matching
  extractKeySkills(parsedData: ParsedResumeData): string[] {
    return parsedData.skills || [];
  }

  // Calculate years of experience from work history
  calculateExperienceYears(parsedData: ParsedResumeData): number {
    if (parsedData.totalExperience) {
      const match = parsedData.totalExperience.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Fallback: count unique companies or roles
    if (parsedData.experience && parsedData.experience.length > 0) {
      return parsedData.experience.length;
    }

    return 0;
  }

  // Generate a professional summary for applications
  generateApplicationSummary(parsedData: ParsedResumeData): string {
    const skills = parsedData.skills?.slice(0, 5).join(', ') || '';
    const experience = parsedData.totalExperience || 'relevant experience';
    const currentRole = parsedData.experience?.[0]?.role || 'professional';

    return `Experienced ${currentRole} with ${experience} in ${skills}. ${parsedData.summary || 'Seeking new opportunities to contribute technical expertise and drive innovation.'}`;
  }

  // Validate parsed data completeness
  validateParsedData(parsedData: ParsedResumeData): {
    isValid: boolean;
    missingFields: string[];
    completeness: number;
  } {
    const requiredFields = [
      'personalInfo.name',
      'personalInfo.email',
      'personalInfo.phone',
      'experience',
      'skills'
    ];

    const missingFields: string[] = [];
    let foundFields = 0;

    requiredFields.forEach(field => {
      const [section, subsection] = field.split('.');
      
      if (subsection) {
        if (!parsedData[section as keyof ParsedResumeData] || 
            !(parsedData[section as keyof ParsedResumeData] as any)?.[subsection]) {
          missingFields.push(field);
        } else {
          foundFields++;
        }
      } else {
        if (!parsedData[field as keyof ParsedResumeData] || 
            (Array.isArray(parsedData[field as keyof ParsedResumeData]) && 
             (parsedData[field as keyof ParsedResumeData] as any[]).length === 0)) {
          missingFields.push(field);
        } else {
          foundFields++;
        }
      }
    });

    const completeness = Math.round((foundFields / requiredFields.length) * 100);

    return {
      isValid: missingFields.length <= 2, // Allow up to 2 missing fields
      missingFields,
      completeness
    };
  }
}

// Export singleton instance
export const resumeParserService = new ResumeParserService();