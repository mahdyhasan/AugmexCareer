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
      const category: JobCategory = {
        id: randomUUID(),
        ...cat,
        createdAt: new Date(),
      };
      this.jobCategories.set(category.id, category);
    }

    // Create admin user
    const adminUser: User = {
      id: "admin-user-id",
      email: "admin@techcorp.com",
      password: "admin123", // In real app, this would be hashed
      fullName: "Sarah Johnson",
      role: "admin",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=32&h=32",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
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
      salaryCurrency: insertJob.salaryCurrency ?? null,
      benefits: insertJob.benefits ?? null,
      requirements: insertJob.requirements ?? null,
      responsibilities: insertJob.responsibilities ?? null,
      companyId: insertJob.companyId ?? null,
      categoryId: insertJob.categoryId ?? null,
      applicationFormFields: insertJob.applicationFormFields ?? null,
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
      customFields: insertApplication.customFields ?? null,
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
