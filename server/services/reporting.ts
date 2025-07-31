import { storage } from "../storage";
import type { Application, Job } from "@shared/schema";

export interface ReportMetrics {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  applicationsByMonth: { month: string; count: number }[];
  averageTimeToHire: number; // days
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

export interface HiringFunnelReport {
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
  averageTimeInStage: Record<string, number>; // days
  topCandidates: {
    name: string;
    email: string;
    aiScore: number;
    status: string;
  }[];
}

export interface CandidateReport {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  applications: {
    jobTitle: string;
    appliedDate: string;
    currentStatus: string;
    aiScore?: number;
    timeInProcess: number; // days
  }[];
  totalApplications: number;
  averageAIScore: number;
  mostRecentStatus: string;
}

export class ReportingService {
  async generateOverallMetrics(): Promise<ReportMetrics> {
    const applications = await storage.getApplications();
    const jobs = await storage.getJobs();

    // Basic counts
    const totalApplications = applications.length;
    const applicationsByStatus = this.groupByStatus(applications);
    const applicationsByMonth = this.groupByMonth(applications);

    // Time to hire calculation
    const averageTimeToHire = this.calculateAverageTimeToHire(applications);

    // Top performing jobs
    const jobApplicationCounts = this.countApplicationsByJob(applications, jobs);
    const topPerformingJobs = Object.entries(jobApplicationCounts)
      .map(([jobTitle, count]) => ({ jobTitle, applicationCount: count }))
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 5);

    // Conversion rates
    const conversionRates = this.calculateConversionRates(applications);

    // AI metrics
    const aiScores = applications
      .map(app => app.aiScore)
      .filter((score): score is number => score !== null && score !== undefined);
    const averageAIScore = aiScores.length > 0 
      ? Math.round(aiScores.reduce((sum, score) => sum + score, 0) / aiScores.length)
      : 0;

    // Diversity metrics
    const diversityMetrics = this.calculateDiversityMetrics(applications);

    return {
      totalApplications,
      applicationsByStatus,
      applicationsByMonth,
      averageTimeToHire,
      topPerformingJobs,
      conversionRates,
      averageAIScore,
      diversityMetrics
    };
  }

  async generateHiringFunnelReport(jobId: string): Promise<HiringFunnelReport> {
    const applications = await storage.getApplications(jobId);
    const job = await storage.getJob(jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    const stages = {
      applied: applications.filter(app => app.status === 'applied').length,
      screened: applications.filter(app => app.status === 'screened').length,
      interviewed: applications.filter(app => app.status === 'interviewed').length,
      offer: applications.filter(app => app.status === 'offer').length,
      hired: applications.filter(app => app.status === 'hired').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    };

    const totalApplications = applications.length;
    
    const conversionRates = {
      screeningRate: totalApplications > 0 ? Math.round((stages.screened / totalApplications) * 100) : 0,
      interviewRate: stages.screened > 0 ? Math.round((stages.interviewed / stages.screened) * 100) : 0,
      offerRate: stages.interviewed > 0 ? Math.round((stages.offer / stages.interviewed) * 100) : 0,
      hireRate: stages.offer > 0 ? Math.round((stages.hired / stages.offer) * 100) : 0,
    };

    const averageTimeInStage = this.calculateAverageTimeInStage(applications);

    const topCandidates = applications
      .filter(app => app.aiScore && app.aiScore > 0)
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 5)
      .map(app => ({
        name: app.candidateName,
        email: app.candidateEmail,
        aiScore: app.aiScore || 0,
        status: app.status || 'applied'
      }));

    return {
      jobId,
      jobTitle: job.title,
      totalApplications,
      stages,
      conversionRates,
      averageTimeInStage,
      topCandidates
    };
  }

  async generateCandidateReport(candidateEmail: string): Promise<CandidateReport> {
    const applications = await storage.getApplications();
    const candidateApplications = applications.filter(
      app => app.candidateEmail.toLowerCase() === candidateEmail.toLowerCase()
    );

    if (candidateApplications.length === 0) {
      throw new Error("No applications found for this candidate");
    }

    const jobs = await storage.getJobs();
    const jobsMap = new Map(jobs.map(job => [job.id, job]));

    const candidateName = candidateApplications[0].candidateName;
    const candidateId = candidateEmail; // Using email as ID

    const applicationsWithDetails = candidateApplications.map(app => {
      const job = jobsMap.get(app.jobId!);
      const appliedDate = new Date(app.createdAt!);
      const timeInProcess = Math.floor(
        (Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        jobTitle: job?.title || 'Unknown Position',
        appliedDate: appliedDate.toLocaleDateString(),
        currentStatus: app.status || 'applied',
        aiScore: app.aiScore,
        timeInProcess
      };
    });

    const aiScores = candidateApplications
      .map(app => app.aiScore)
      .filter((score): score is number => score !== null && score !== undefined);
    
    const averageAIScore = aiScores.length > 0
      ? Math.round(aiScores.reduce((sum, score) => sum + score, 0) / aiScores.length)
      : 0;

    const mostRecentApplication = candidateApplications
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];

    return {
      candidateId,
      candidateName,
      candidateEmail,
      applications: applicationsWithDetails,
      totalApplications: candidateApplications.length,
      averageAIScore,
      mostRecentStatus: mostRecentApplication.status || 'applied'
    };
  }

  async exportApplicationsCSV(): Promise<string> {
    const applications = await storage.getApplications();
    const jobs = await storage.getJobs();
    const jobsMap = new Map(jobs.map(job => [job.id, job]));

    const headers = [
      'Application ID',
      'Candidate Name',
      'Candidate Email',
      'Phone',
      'Job Title',
      'Status',
      'AI Score',
      'Applied Date',
      'Location',
      'Experience',
      'Current Company'
    ];

    const rows = applications.map(app => {
      const job = jobsMap.get(app.jobId!);
      return [
        app.id,
        app.candidateName,
        app.candidateEmail,
        app.candidatePhone || '',
        job?.title || 'Unknown',
        app.status || 'applied',
        app.aiScore?.toString() || '',
        new Date(app.createdAt!).toLocaleDateString(),
        app.location || '',
        app.yearsOfExperience || '',
        app.currentCompany || ''
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private groupByStatus(applications: Application[]): Record<string, number> {
    const statusCounts: Record<string, number> = {};
    
    applications.forEach(app => {
      const status = app.status || 'applied';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return statusCounts;
  }

  private groupByMonth(applications: Application[]): { month: string; count: number }[] {
    const monthCounts: Record<string, number> = {};

    applications.forEach(app => {
      const date = new Date(app.createdAt!);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateAverageTimeToHire(applications: Application[]): number {
    const hiredApplications = applications.filter(app => app.status === 'hired');
    
    if (hiredApplications.length === 0) return 0;

    const totalDays = hiredApplications.reduce((sum, app) => {
      const appliedDate = new Date(app.createdAt!);
      const hiredDate = new Date(); // In real system, would track actual hire date
      const days = Math.floor((hiredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / hiredApplications.length);
  }

  private countApplicationsByJob(applications: Application[], jobs: Job[]): Record<string, number> {
    const jobsMap = new Map(jobs.map(job => [job.id, job.title]));
    const jobCounts: Record<string, number> = {};

    applications.forEach(app => {
      const jobTitle = jobsMap.get(app.jobId!) || 'Unknown';
      jobCounts[jobTitle] = (jobCounts[jobTitle] || 0) + 1;
    });

    return jobCounts;
  }

  private calculateConversionRates(applications: Application[]): {
    appliedToScreened: number;
    screenedToInterviewed: number;
    interviewedToHired: number;
  } {
    const total = applications.length;
    const screened = applications.filter(app => 
      ['screened', 'interviewed', 'offer', 'hired'].includes(app.status || '')
    ).length;
    const interviewed = applications.filter(app => 
      ['interviewed', 'offer', 'hired'].includes(app.status || '')
    ).length;
    const hired = applications.filter(app => app.status === 'hired').length;

    return {
      appliedToScreened: total > 0 ? Math.round((screened / total) * 100) : 0,
      screenedToInterviewed: screened > 0 ? Math.round((interviewed / screened) * 100) : 0,
      interviewedToHired: interviewed > 0 ? Math.round((hired / interviewed) * 100) : 0,
    };
  }

  private calculateDiversityMetrics(applications: Application[]): {
    experienceLevels: Record<string, number>;
    locations: Record<string, number>;
  } {
    const experienceLevels: Record<string, number> = {};
    const locations: Record<string, number> = {};

    applications.forEach(app => {
      // Group by years of experience
      const experience = app.yearsOfExperience || 'Not specified';
      experienceLevels[experience] = (experienceLevels[experience] || 0) + 1;

      // Group by location
      const location = app.location || 'Not specified';
      locations[location] = (locations[location] || 0) + 1;
    });

    return { experienceLevels, locations };
  }

  private calculateAverageTimeInStage(applications: Application[]): Record<string, number> {
    // Simplified calculation - in real system would track status change history
    const stageMap: Record<string, number> = {
      applied: 2,
      screened: 5,
      interviewed: 7,
      offer: 3,
      hired: 1,
      rejected: 0
    };

    return stageMap;
  }
}

export const reportingService = new ReportingService();