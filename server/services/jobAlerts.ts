import { storage } from "../storage";
import type { JobAlert, Job, InsertJobAlert } from "../../shared/schema";
import { sendEmail } from "./email";

export interface JobMatchCriteria {
  keywords?: string[];
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  categoryId?: string;
}

export class JobAlertsService {
  private jobAlertsStore: JobAlert[] = [];

  // Create job alert subscription
  async createJobAlert(alertData: InsertJobAlert): Promise<JobAlert> {
    // Using in-memory storage for now - in production this would use the database
    const alert: JobAlert = {
      id: globalThis.crypto.randomUUID(),
      email: alertData.email,
      keywords: alertData.keywords || null,
      location: alertData.location || null,
      employmentType: alertData.employmentType || null,
      experienceLevel: alertData.experienceLevel || null,
      categoryId: alertData.categoryId || null,
      isActive: alertData.isActive ?? true,
      lastSent: null,
      createdAt: new Date(),
    };
    
    // In production, this would be stored in database
    this.jobAlertsStore.push(alert);
    return alert;
  }

  // Get all active job alerts
  async getActiveJobAlerts(): Promise<JobAlert[]> {
    return this.jobAlertsStore.filter(alert => alert.isActive);
  }

  // Get job alerts by email
  async getJobAlertsByEmail(email: string): Promise<JobAlert[]> {
    return this.jobAlertsStore.filter(alert => alert.email === email);
  }

  // Update job alert
  async updateJobAlert(id: string, updates: Partial<JobAlert>): Promise<JobAlert | null> {
    const alertIndex = this.jobAlertsStore.findIndex(alert => alert.id === id);
    if (alertIndex === -1) return null;
    
    this.jobAlertsStore[alertIndex] = {
      ...this.jobAlertsStore[alertIndex],
      ...updates,
    };
    
    return this.jobAlertsStore[alertIndex];
  }

  // Deactivate job alert
  async deactivateJobAlert(id: string): Promise<boolean> {
    const alertIndex = this.jobAlertsStore.findIndex(alert => alert.id === id);
    if (alertIndex === -1) return false;
    
    this.jobAlertsStore[alertIndex].isActive = false;
    return true;
  }

  // Find matching jobs for alert criteria
  async findMatchingJobs(criteria: JobMatchCriteria): Promise<Job[]> {
    const allJobs = await storage.getJobs({ status: "active" });
    
    return allJobs.filter(job => {
      // Check keywords
      if (criteria.keywords && criteria.keywords.length > 0) {
        const hasKeywordMatch = criteria.keywords.some(keyword => 
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(keyword.toLowerCase()) ||
          (job.requirements && job.requirements.toLowerCase().includes(keyword.toLowerCase()))
        );
        if (!hasKeywordMatch) return false;
      }

      // Check location
      if (criteria.location && job.location) {
        if (!job.location.toLowerCase().includes(criteria.location.toLowerCase())) {
          return false;
        }
      }

      // Check employment type
      if (criteria.employmentType && job.employmentType !== criteria.employmentType) {
        return false;
      }

      // Check experience level
      if (criteria.experienceLevel && job.experienceLevel !== criteria.experienceLevel) {
        return false;
      }

      // Check category
      if (criteria.categoryId && job.categoryId !== criteria.categoryId) {
        return false;
      }

      return true;
    }).slice(0, 10); // Limit to 10 matches per alert
  }

  // Find jobs matching a specific alert
  async findJobsMatchingAlert(alert: JobAlert, jobs?: Job[]): Promise<Job[]> {
    const criteria: JobMatchCriteria = {
      keywords: alert.keywords ? alert.keywords.split(',').map(k => k.trim()) : undefined,
      location: alert.location || undefined,
      employmentType: alert.employmentType || undefined,
      experienceLevel: alert.experienceLevel || undefined,
      categoryId: alert.categoryId || undefined,
    };

    if (jobs) {
      // Filter provided jobs
      return jobs.filter(job => this.jobMatchesCriteria(job, criteria));
    } else {
      // Find matching jobs from all active jobs
      return await this.findMatchingJobs(criteria);
    }
  }

  // Check if a job matches criteria
  private jobMatchesCriteria(job: Job, criteria: JobMatchCriteria): boolean {
    // Check keywords
    if (criteria.keywords && criteria.keywords.length > 0) {
      const hasKeywordMatch = criteria.keywords.some(keyword => 
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.description.toLowerCase().includes(keyword.toLowerCase()) ||
        (job.requirements && job.requirements.toLowerCase().includes(keyword.toLowerCase()))
      );
      if (!hasKeywordMatch) return false;
    }

    // Check location
    if (criteria.location && job.location) {
      if (!job.location.toLowerCase().includes(criteria.location.toLowerCase())) {
        return false;
      }
    }

    // Check employment type
    if (criteria.employmentType && job.employmentType !== criteria.employmentType) {
      return false;
    }

    // Check experience level
    if (criteria.experienceLevel && job.experienceLevel !== criteria.experienceLevel) {
      return false;
    }

    // Check category
    if (criteria.categoryId && job.categoryId !== criteria.categoryId) {
      return false;
    }

    return true;
  }

  // Send job alert email
  async sendJobAlert(alert: JobAlert, matchingJobs: Job[]): Promise<boolean> {
    try {
      if (matchingJobs.length === 0) {
        return true; // No jobs to send, but not an error
      }

      const subject = `New Job Opportunities - ${matchingJobs.length} matches found`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Job Opportunities at Augmex</h2>
          
          <p>Hello,</p>
          <p>We found ${matchingJobs.length} new job${matchingJobs.length === 1 ? '' : 's'} that match your job alert criteria:</p>
          
          <div style="margin: 20px 0;">
            ${matchingJobs.map(job => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 10px 0;">
                <h3 style="color: #1f2937; margin: 0 0 8px 0;">${job.title}</h3>
                <p style="color: #6b7280; margin: 4px 0;"><strong>Location:</strong> ${job.location || 'Not specified'}</p>
                <p style="color: #6b7280; margin: 4px 0;"><strong>Type:</strong> ${job.employmentType}</p>
                <p style="color: #6b7280; margin: 4px 0;"><strong>Experience:</strong> ${job.experienceLevel}</p>
                <p style="margin: 8px 0;">${job.description.substring(0, 200)}...</p>
                <a href="${process.env.BASE_URL || 'https://augmex.io'}/jobs/${job.slug}" 
                   style="background-color: #2563eb; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 8px;">
                  View Job & Apply
                </a>
              </div>
            `).join('')}
          </div>
          
          <p>Best regards,<br>The Augmex Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af;">
            You're receiving this email because you signed up for job alerts. 
            <a href="${process.env.BASE_URL || 'https://augmex.io'}/unsubscribe?alert=${alert.id}">Unsubscribe</a>
          </p>
        </div>
      `;

      await sendEmail({
        to: alert.email,
        from: process.env.FROM_EMAIL || 'noreply@augmex.io',
        subject,
        html,
        text: `New Job Opportunities - ${matchingJobs.length} matches found. Visit our website to view the full details.`
      });

      // Update last sent timestamp
      await this.updateJobAlert(alert.id, { lastSent: new Date() });

      return true;
    } catch (error) {
      console.error('Failed to send job alert email:', error);
      return false;
    }
  }

  // Process all active job alerts (called by scheduler)
  async processJobAlerts(): Promise<void> {
    try {
      const activeAlerts = await this.getActiveJobAlerts();
      
      for (const alert of activeAlerts) {
        // Check if we should send this alert (not sent in last 24 hours)
        const now = new Date();
        const lastSent = alert.lastSent ? new Date(alert.lastSent) : null;
        
        if (!lastSent || (now.getTime() - lastSent.getTime()) >= 24 * 60 * 60 * 1000) {
          // Get jobs posted in the last 24 hours
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          const allJobs = await storage.getJobs({ status: "active" });
          const recentJobs = allJobs.filter(job => {
            const jobDate = new Date(job.createdAt);
            return jobDate >= yesterday;
          });

          if (recentJobs.length > 0) {
            const matchingJobs = await this.findJobsMatchingAlert(alert, recentJobs);
            
            if (matchingJobs.length > 0) {
              await this.sendJobAlert(alert, matchingJobs);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing job alerts:', error);
    }
  }

  // Send welcome email for new job alert
  async sendWelcomeEmail(alert: JobAlert): Promise<boolean> {
    try {
      const subject = "Job Alert Activated - Augmex Career Portal";
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Job Alert Activated</h2>
          
          <p>Hello,</p>
          <p>Your job alert has been successfully activated! Here are your preferences:</p>
          
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${alert.email}</p>
            ${alert.keywords ? `<p><strong>Keywords:</strong> ${alert.keywords}</p>` : ''}
            ${alert.location ? `<p><strong>Location:</strong> ${alert.location}</p>` : ''}
            ${alert.employmentType ? `<p><strong>Employment Type:</strong> ${alert.employmentType}</p>` : ''}
            ${alert.experienceLevel ? `<p><strong>Experience Level:</strong> ${alert.experienceLevel}</p>` : ''}
          </div>
          
          <p>We'll send you email notifications when new jobs match your criteria. You can expect to receive alerts within 24 hours of new job postings.</p>
          
          <p>Best regards,<br>The Augmex Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af;">
            You can manage your job alerts anytime by visiting our careers page.
          </p>
        </div>
      `;

      await sendEmail({
        to: alert.email,
        from: process.env.FROM_EMAIL || 'noreply@augmex.io',
        subject,
        html,
        text: "Your job alert has been activated. You'll receive notifications for matching jobs."
      });

      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }
}

// Export singleton instance
export const jobAlertsService = new JobAlertsService();