import { 
  type User, 
  type InsertUser, 
  type Job, 
  type InsertJob,
  type Application,
  type InsertApplication,
  type Company,
  type InsertCompany,
  type JobCategory,
  type InsertJobCategory,
  type ApplicationStatusHistory
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Job methods
  getJobs(filters?: {
    status?: string;
    employmentType?: string;
    experienceLevel?: string;
    remoteType?: string;
    search?: string;
  }): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  getJobBySlug(slug: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;

  // Application methods
  getApplications(jobId?: string): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined>;
  getApplicationsByEmail(email: string): Promise<Application[]>;

  // Company methods
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;

  // Job Category methods
  getJobCategories(): Promise<JobCategory[]>;
  createJobCategory(category: InsertJobCategory): Promise<JobCategory>;

  // Analytics methods
  getDashboardStats(): Promise<{
    activeJobs: number;
    newApplications: number;
    interviews: number;
    aiScreened: number;
  }>;

  // Application status history
  addStatusHistory(applicationId: string, previousStatus: string, newStatus: string, changedBy: string, notes?: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;
  private applications: Map<string, Application>;
  private companies: Map<string, Company>;
  private jobCategories: Map<string, JobCategory>;
  private statusHistory: Map<string, ApplicationStatusHistory>;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.companies = new Map();
    this.jobCategories = new Map();
    this.statusHistory = new Map();
    
    // Initialize with default company and categories
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    // Create default company
    const defaultCompany: Company = {
      id: "default-company-id",
      name: "TechCorp",
      description: "Leading technology company",
      website: "https://techcorp.com",
      logoUrl: "",
      industry: "Technology",
      size: "100-500",
      location: "San Francisco, CA",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(defaultCompany.id, defaultCompany);

    // Create default categories
    const categories = [
      { name: "Engineering", description: "Software development roles", icon: "code" },
      { name: "Design", description: "UI/UX and graphic design", icon: "palette" },
      { name: "Product", description: "Product management roles", icon: "product" },
      { name: "Marketing", description: "Marketing and growth roles", icon: "megaphone" },
      { name: "Sales", description: "Sales and business development", icon: "handshake" },
      { name: "Data & Analytics", description: "Data science and analytics", icon: "chart" },
    ];

    for (const cat of categories) {
      const categoryId = randomUUID();
      const category: JobCategory = {
        id: categoryId,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        createdAt: new Date(),
      };
      this.jobCategories.set(categoryId, category);
    }

    // Create Augmex company
    const augmexCompany: Company = {
      id: "augmex-company-id",
      name: "Augmex",
      description: "A leading technology company specializing in innovative software solutions and digital transformation services.",
      website: "https://augmex.io",
      logoUrl: "/augmex_logo_retina_1753883414771.png",
      industry: "Technology",
      size: "51-200 employees",
      location: "San Francisco, CA",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(augmexCompany.id, augmexCompany);

    // Create admin user
    const adminUser: User = {
      id: "admin-user-id",
      email: "admin@augmex.io",
      password: "admin123", // In real app, this would be hashed
      fullName: "Sarah Johnson",
      role: "admin",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=32&h=32",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create demo jobs
    const demoJobs = [
      {
        id: "job-1",
        companyId: augmexCompany.id,
        categoryId: Array.from(this.jobCategories.values())[0].id,
        title: "Senior Frontend Developer",
        slug: "senior-frontend-developer",
        description: "We are looking for an experienced Frontend Developer to join our dynamic team at Augmex. You will be responsible for developing user-facing web applications using modern JavaScript frameworks and ensuring excellent user experience across all our products.",
        requirements: "• 5+ years of experience with React, Vue.js, or Angular\n• Strong proficiency in JavaScript, HTML5, and CSS3\n• Experience with responsive design and mobile-first development\n• Knowledge of state management libraries (Redux, Vuex)\n• Familiarity with build tools (Webpack, Vite)\n• Experience with version control systems (Git)\n• Strong problem-solving skills and attention to detail",
        responsibilities: "• Develop and maintain user-facing web applications\n• Collaborate with designers to implement pixel-perfect UI designs\n• Optimize applications for maximum speed and scalability\n• Write clean, maintainable, and well-documented code\n• Participate in code reviews and mentor junior developers\n• Stay up-to-date with the latest frontend technologies and best practices",
        benefits: "• Competitive salary and equity package\n• Health, dental, and vision insurance\n• Flexible working hours and remote work options\n• Professional development budget\n• Modern office space with free snacks and drinks\n• Annual team retreats and company events",
        employmentType: "full-time",
        experienceLevel: "senior",
        location: "San Francisco, CA",
        remoteType: "hybrid",
        salaryMin: 120000,
        salaryMax: 160000,
        currency: "USD",
        skills: ["React", "JavaScript", "TypeScript", "CSS3", "HTML5"],
        status: "active",
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "job-2",
        companyId: augmexCompany.id,
        categoryId: Array.from(this.jobCategories.values())[0].id,
        title: "Full Stack Engineer",
        slug: "full-stack-engineer",
        description: "Join Augmex as a Full Stack Engineer and work on cutting-edge projects that impact thousands of users. You'll work with both frontend and backend technologies to build scalable, reliable, and user-friendly applications.",
        requirements: "• 3+ years of full-stack development experience\n• Proficiency in Node.js, Python, or similar backend technologies\n• Experience with React, Vue.js, or Angular\n• Knowledge of database systems (PostgreSQL, MongoDB)\n• Understanding of RESTful APIs and GraphQL\n• Experience with cloud platforms (AWS, GCP, or Azure)\n• Strong debugging and problem-solving skills",
        responsibilities: "• Design and develop full-stack web applications\n• Build and maintain APIs and database schemas\n• Implement automated testing and deployment pipelines\n• Collaborate with product and design teams\n• Troubleshoot and debug applications across the stack\n• Contribute to architectural decisions and technical strategy",
        benefits: "• Competitive salary and stock options\n• Comprehensive health and wellness benefits\n• Flexible PTO and sabbatical program\n• Learning and development opportunities\n• State-of-the-art equipment and workspace\n• Catered lunch and team building activities",
        employmentType: "full-time",
        experienceLevel: "mid",
        location: "San Francisco, CA",
        remoteType: "remote",
        salaryMin: 100000,
        salaryMax: 140000,
        currency: "USD",
        skills: ["Node.js", "React", "PostgreSQL", "TypeScript", "AWS"],
        status: "active",
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "job-3",
        companyId: augmexCompany.id,
        categoryId: Array.from(this.jobCategories.values())[3].id,
        title: "Product Marketing Manager",
        slug: "product-marketing-manager",
        description: "We're seeking a strategic Product Marketing Manager to drive go-to-market strategies for Augmex's innovative technology products. You'll work closely with product, sales, and marketing teams to position our solutions in the market.",
        requirements: "• 4+ years of product marketing experience in tech industry\n• Strong analytical and strategic thinking skills\n• Experience with market research and competitive analysis\n• Excellent written and verbal communication skills\n• Knowledge of digital marketing channels and tools\n• Experience with product launches and positioning\n• Bachelor's degree in Marketing, Business, or related field",
        responsibilities: "• Develop and execute go-to-market strategies\n• Create compelling product messaging and positioning\n• Conduct market research and competitive analysis\n• Collaborate with sales team on enablement materials\n• Manage product launches and marketing campaigns\n• Analyze market trends and customer feedback\n• Work with product team on roadmap prioritization",
        benefits: "• Competitive base salary plus performance bonuses\n• Health, dental, and vision coverage\n• Flexible work arrangements\n• Professional development budget\n• Company equity program\n• Wellness stipend and gym membership",
        employmentType: "full-time",
        experienceLevel: "mid",
        location: "San Francisco, CA",
        remoteType: "hybrid",
        salaryMin: 95000,
        salaryMax: 130000,
        currency: "USD",
        skills: ["Product Marketing", "Go-to-Market Strategy", "Market Research", "Content Creation"],
        status: "active",
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "job-4",
        companyId: augmexCompany.id,
        categoryId: Array.from(this.jobCategories.values())[0].id,
        title: "DevOps Engineer",
        slug: "devops-engineer",
        description: "Augmex is looking for a skilled DevOps Engineer to help us scale our infrastructure and improve our deployment processes. You'll work on building reliable, secure, and scalable systems that support our growing product suite.",
        requirements: "• 3+ years of DevOps or infrastructure experience\n• Proficiency with containerization (Docker, Kubernetes)\n• Experience with cloud platforms (AWS, GCP, Azure)\n• Knowledge of Infrastructure as Code (Terraform, CloudFormation)\n• Understanding of CI/CD pipelines and automation\n• Experience with monitoring and logging tools\n• Strong scripting skills (Python, Bash, etc.)",
        responsibilities: "• Design and maintain cloud infrastructure\n• Implement and improve CI/CD pipelines\n• Monitor system performance and reliability\n• Automate deployment and scaling processes\n• Ensure security best practices across infrastructure\n• Collaborate with development teams on deployment strategies\n• Troubleshoot production issues and implement solutions",
        benefits: "• Competitive salary and equity compensation\n• Premium health, dental, and vision insurance\n• Unlimited PTO and flexible working hours\n• Home office setup allowance\n• Professional certification support\n• Annual learning and conference budget",
        employmentType: "full-time",
        experienceLevel: "mid",
        location: "San Francisco, CA",
        remoteType: "remote",
        salaryMin: 110000,
        salaryMax: 150000,
        currency: "USD",
        skills: ["AWS", "Kubernetes", "Docker", "Terraform", "Python", "CI/CD"],
        status: "active",
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Add demo jobs to storage
    demoJobs.forEach(job => {
      const jobWithDefaults: Job = {
        ...job,
        salaryMin: job.salaryMin?.toString() || null,
        salaryMax: job.salaryMax?.toString() || null,
        applicationDeadline: null,
        applicationFormConfig: null,
      };
      this.jobs.set(job.id, jobWithDefaults);
    });

    // Create demo applications
    const demoApplications = [
      {
        id: "app-1",
        jobId: "job-1",
        candidateEmail: "alex.chen@email.com",
        candidateName: "Alex Chen",
        candidatePhone: "+1-555-0123",
        location: "San Francisco, CA",
        currentCompany: "TechCorp Inc.",
        currentRole: "Frontend Developer",
        timeWithCurrentCompany: "2 years 6 months",
        yearsOfExperience: "5 years",
        linkedinProfile: "https://linkedin.com/in/alexchen",
        gitProfile: "https://github.com/alexchen",
        resumeUrl: "/resumes/alex-chen-resume.pdf",
        coverLetter: "I am excited to apply for the Senior Frontend Developer position at Augmex. With over 5 years of experience in React and modern JavaScript frameworks, I am confident I can contribute to your team's success.",
        status: "online_interview",
        aiScore: 87,
        aiAnalysis: {
          skillsMatch: ["React", "JavaScript", "TypeScript", "CSS3"],
          experienceLevel: "senior",
          strengths: ["Strong frontend expertise", "Leadership experience", "Open source contributions"],
          recommendations: "Excellent candidate with relevant experience and strong technical skills."
        },
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: "app-2",
        jobId: "job-2",
        candidateEmail: "maria.garcia@email.com",
        candidateName: "Maria Garcia",
        candidatePhone: "+1-555-0456",
        location: "Austin, TX",
        currentCompany: "StartupXYZ",
        currentRole: "Full Stack Developer",
        timeWithCurrentCompany: "1 year 8 months",
        yearsOfExperience: "4 years",
        linkedinProfile: "https://linkedin.com/in/mariagarcia",
        gitProfile: "https://github.com/mariagarcia",
        resumeUrl: "/resumes/maria-garcia-resume.pdf",
        coverLetter: "I am passionate about building scalable web applications and would love to bring my full-stack expertise to Augmex's innovative projects.",
        status: "screened",
        aiScore: 82,
        aiAnalysis: {
          skillsMatch: ["Node.js", "React", "PostgreSQL", "TypeScript"],
          experienceLevel: "mid",
          strengths: ["Full-stack expertise", "Startup experience", "Fast learner"],
          recommendations: "Strong candidate with good technical foundation and growth potential."
        },
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: "app-3",
        jobId: "job-3",
        candidateEmail: "david.kim@email.com",
        candidateName: "David Kim",
        candidatePhone: "+1-555-0789",
        location: "Los Angeles, CA",
        currentCompany: "Marketing Pro LLC",
        currentRole: "Senior Marketing Specialist",
        timeWithCurrentCompany: "3 years 2 months",
        yearsOfExperience: "6 years",
        linkedinProfile: "https://linkedin.com/in/davidkim",
        gitProfile: null,
        resumeUrl: "/resumes/david-kim-resume.pdf",
        coverLetter: "With extensive experience in product marketing and a proven track record of successful product launches, I am excited about the opportunity to drive Augmex's go-to-market strategies.",
        status: "offer_letter",
        aiScore: 78,
        aiAnalysis: {
          skillsMatch: ["Product Marketing", "Go-to-Market Strategy", "Market Research"],
          experienceLevel: "senior",
          strengths: ["Marketing expertise", "Product launch experience", "Strategic thinking"],
          recommendations: "Good fit for marketing role with relevant experience in product positioning."
        },
        appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        id: "app-4",
        jobId: "job-4",
        candidateEmail: "sarah.johnson@email.com",
        candidateName: "Sarah Johnson",
        candidatePhone: "+1-555-0321",
        location: "Seattle, WA",
        currentCompany: "CloudTech Solutions",
        currentRole: "Infrastructure Engineer",
        timeWithCurrentCompany: "2 years 10 months",
        yearsOfExperience: "4 years",
        linkedinProfile: "https://linkedin.com/in/sarahjohnson",
        gitProfile: "https://github.com/sarahjohnson",
        resumeUrl: "/resumes/sarah-johnson-resume.pdf",
        coverLetter: "I am passionate about building scalable infrastructure and automating deployment processes. My experience with AWS and Kubernetes aligns perfectly with Augmex's tech stack.",
        status: "assessed",
        aiScore: 85,
        aiAnalysis: {
          skillsMatch: ["AWS", "Kubernetes", "Docker", "Python", "CI/CD"],
          experienceLevel: "mid",
          strengths: ["Cloud expertise", "Automation skills", "Problem-solving"],
          recommendations: "Excellent technical fit with strong cloud and automation experience."
        },
        appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: "app-5",
        jobId: "job-1",
        candidateEmail: "james.wilson@email.com",
        candidateName: "James Wilson",
        candidatePhone: "+1-555-0654",
        location: "New York, NY",
        currentCompany: "WebDev Agency",
        currentRole: "Lead Frontend Developer",
        timeWithCurrentCompany: "1 year 4 months",
        yearsOfExperience: "7 years",
        linkedinProfile: "https://linkedin.com/in/jameswilson",
        gitProfile: "https://github.com/jameswilson",
        resumeUrl: "/resumes/james-wilson-resume.pdf",
        coverLetter: "As a passionate frontend developer with 7 years of experience, I am excited about the opportunity to join Augmex and contribute to building exceptional user experiences.",
        status: "submitted",
        aiScore: 91,
        aiAnalysis: {
          skillsMatch: ["React", "JavaScript", "TypeScript", "CSS3", "HTML5"],
          experienceLevel: "senior",
          strengths: ["Extensive frontend experience", "Leadership skills", "Performance optimization"],
          recommendations: "Outstanding candidate with exceptional frontend skills and leadership experience."
        },
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      }
    ];

    // Add demo applications to storage
    demoApplications.forEach(app => {
      this.applications.set(app.id, app as Application);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      role: insertUser.role ?? null,
      fullName: insertUser.fullName ?? null,
      avatarUrl: insertUser.avatarUrl ?? null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Job methods
  async getJobs(filters?: {
    status?: string;
    employmentType?: string;
    experienceLevel?: string;
    remoteType?: string;
    search?: string;
  }): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values());

    if (filters) {
      if (filters.status) {
        jobs = jobs.filter(job => job.status === filters.status);
      }
      if (filters.employmentType) {
        jobs = jobs.filter(job => job.employmentType === filters.employmentType);
      }
      if (filters.experienceLevel) {
        jobs = jobs.filter(job => job.experienceLevel === filters.experienceLevel);
      }
      if (filters.remoteType) {
        jobs = jobs.filter(job => job.remoteType === filters.remoteType);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower)
        );
      }
    }

    return jobs.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobBySlug(slug: string): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(job => job.slug === slug);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const slug = insertJob.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const job: Job = {
      ...insertJob,
      status: insertJob.status ?? null,
      location: insertJob.location ?? null,
      remoteType: insertJob.remoteType ?? null,
      salaryMin: insertJob.salaryMin ?? null,
      salaryMax: insertJob.salaryMax ?? null,
      currency: insertJob.currency ?? "USD",
      benefits: insertJob.benefits ?? null,
      requirements: insertJob.requirements ?? null,
      responsibilities: insertJob.responsibilities ?? null,
      companyId: insertJob.companyId ?? null,
      categoryId: insertJob.categoryId ?? null,
      applicationFormConfig: insertJob.applicationFormConfig ?? null,
      applicationDeadline: insertJob.applicationDeadline ?? null,
      skills: insertJob.skills ?? null,
      createdBy: insertJob.createdBy ?? null,
      id,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...updates, updatedAt: new Date() };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  // Application methods
  async getApplications(jobId?: string): Promise<Application[]> {
    let applications = Array.from(this.applications.values());
    
    if (jobId) {
      applications = applications.filter(app => app.jobId === jobId);
    }
    
    return applications.sort((a, b) => new Date(b.appliedAt!).getTime() - new Date(a.appliedAt!).getTime());
  }

  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const application: Application = {
      ...insertApplication,
      jobId: insertApplication.jobId ?? null,
      status: insertApplication.status ?? null,
      candidatePhone: insertApplication.candidatePhone ?? null,
      resumeUrl: insertApplication.resumeUrl ?? null,
      coverLetter: insertApplication.coverLetter ?? null,
      applicationData: insertApplication.applicationData ?? null,
      location: insertApplication.location ?? null,
      currentCompany: insertApplication.currentCompany ?? null,
      currentRole: insertApplication.currentRole ?? null,
      timeWithCurrentCompany: insertApplication.timeWithCurrentCompany ?? null,
      yearsOfExperience: insertApplication.yearsOfExperience ?? null,
      linkedinProfile: insertApplication.linkedinProfile ?? null,
      gitProfile: insertApplication.gitProfile ?? null,
      aiScore: insertApplication.aiScore ?? null,
      aiAnalysis: insertApplication.aiAnalysis ?? null,
      id,
      appliedAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, ...updates, updatedAt: new Date() };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async getApplicationsByEmail(email: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.candidateEmail === email)
      .sort((a, b) => new Date(b.appliedAt!).getTime() - new Date(a.appliedAt!).getTime());
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = {
      ...insertCompany,
      size: insertCompany.size ?? null,
      description: insertCompany.description ?? null,
      location: insertCompany.location ?? null,
      website: insertCompany.website ?? null,
      logoUrl: insertCompany.logoUrl ?? null,
      industry: insertCompany.industry ?? null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  // Job Category methods
  async getJobCategories(): Promise<JobCategory[]> {
    return Array.from(this.jobCategories.values());
  }

  async createJobCategory(insertCategory: InsertJobCategory): Promise<JobCategory> {
    const id = randomUUID();
    const category: JobCategory = {
      ...insertCategory,
      icon: insertCategory.icon ?? null,
      description: insertCategory.description ?? null,
      id,
      createdAt: new Date(),
    };
    this.jobCategories.set(id, category);
    return category;
  }

  // Analytics methods
  async getDashboardStats(): Promise<{
    activeJobs: number;
    newApplications: number;
    interviews: number;
    aiScreened: number;
  }> {
    const jobs = Array.from(this.jobs.values());
    const applications = Array.from(this.applications.values());
    
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const newApplications = applications.filter(app => app.status === 'submitted').length;
    const interviews = applications.filter(app => app.status === 'interviewed').length;
    const aiScreened = applications.filter(app => app.aiScore !== null).length;
    
    return {
      activeJobs,
      newApplications,
      interviews,
      aiScreened,
    };
  }

  // Application status history
  async addStatusHistory(
    applicationId: string, 
    previousStatus: string, 
    newStatus: string, 
    changedBy: string, 
    notes?: string
  ): Promise<void> {
    const id = randomUUID();
    const history: ApplicationStatusHistory = {
      id,
      applicationId,
      previousStatus,
      newStatus,
      notes: notes || null,
      changedBy,
      changedAt: new Date(),
    };
    this.statusHistory.set(id, history);
  }
}

export const storage = new MemStorage();
