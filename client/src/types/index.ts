export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  avatarUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  employmentType: string;
  experienceLevel: string;
  location?: string;
  remoteType?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  skills?: string[];
  applicationDeadline?: string;
  status: string;
  applicationFormConfig?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateEmail: string;
  candidateName: string;
  candidatePhone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  applicationData?: any;
  status: string;
  aiScore?: number;
  aiAnalysis?: {
    overallScore: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    highlights: string[];
    concerns: string[];
    recommendation: string;
  };
  appliedAt?: string;
  updatedAt?: string;
}

export interface JobWithApplications extends Job {
  applicationCount?: number;
}

export interface ApplicationWithJob extends Application {
  job?: Job;
}

export interface DashboardStats {
  activeJobs: number;
  newApplications: number;
  interviews: number;
  aiScreened: number;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'multiselect' | 'file' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    fileTypes?: string[];
  };
}

export interface JobApplicationFormConfig {
  fields: FormField[];
  submitText: string;
  successMessage: string;
}
