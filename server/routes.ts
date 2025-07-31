import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertApplicationSchema, insertUserSchema } from "@shared/schema";
import { analyzeResume, extractResumeText } from "./services/openai";
import { enhancedAI } from "./services/aiEnhanced";
import { interviewScheduler } from "./services/scheduler";
import { reportingService } from "./services/reporting";
import { sendApplicationConfirmation, sendNewApplicationNotification, sendStatusUpdateNotification, setEmailConfig, getEmailConfig, sendEmail } from "./services/email";
import { fileStorage } from "./services/fileStorage";
import { authService, requireAuth, requireRole, requireMinimumRole } from "./services/auth";
import multer from "multer";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
    }
  }
});

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Job filter schema
const jobFiltersSchema = z.object({
  status: z.string().optional(),
  employmentType: z.string().optional(),
  experienceLevel: z.string().optional(),
  remoteType: z.string().optional(),
  search: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));
  
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await authService.authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create session
      const sessionData = authService.createSession(user);
      (req as any).session.user = sessionData;
      
      console.log('Creating session for user:', user.email, 'Session ID:', (req as any).session.id);
      
      // Save session explicitly
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        console.log('Session saved successfully');
        res.json({ user });
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Could not log out" });
        }
        res.clearCookie('sessionId'); // Clear the session cookie
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "No active session" });
    }
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/register", requireAuth, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      const user = await authService.createUser(userData);
      res.status(201).json({ user });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  // User management routes  
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove password from response
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      res.json({ users: safeUsers });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
  });

  // Protected job management routes
  app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      res.status(201).json({ job });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create job" });
    }
  });

  app.put("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ job });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update job" });
    }
  });
  
  app.delete("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteJob(req.params.id);
      if (success) {
        res.json({ message: "Job deleted successfully" });
      } else {
        res.status(404).json({ message: "Job not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete job" });
    }
  });

  // Public job routes (no auth required)
  app.get("/api/jobs", async (req, res) => {
    try {
      const filters = jobFiltersSchema.parse(req.query);
      const jobs = await storage.getJobs(filters);
      res.json({ jobs });
    } catch (error) {
      res.status(400).json({ message: "Invalid filters" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ job });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.get("/api/jobs/slug/:slug", async (req, res) => {
    try {
      const job = await storage.getJobBySlug(req.params.slug);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ job });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      res.status(201).json({ job });
    } catch (error) {
      console.error("Create job error:", error);
      res.status(400).json({ message: "Invalid job data" });
    }
  });

  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const updates = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(req.params.id, updates);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ job });
    } catch (error) {
      res.status(400).json({ message: "Invalid job data" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteJob(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Protected application management routes
  app.get("/api/applications", requireAuth, async (req, res) => {
    try {
      const jobId = req.query.jobId as string;
      const applications = await storage.getApplications(jobId);
      res.json({ applications });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json({ application });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Check for duplicate application
  app.post("/api/applications/check-duplicate", async (req, res) => {
    try {
      const { email, phone, jobId } = req.body;
      const existingApplications = await storage.getApplications(jobId);
      
      const duplicate = existingApplications.find(app => 
        app.candidateEmail === email || app.candidatePhone === phone
      );
      
      if (duplicate) {
        return res.status(409).json({ 
          message: "You have already applied for this position",
          existingApplication: duplicate 
        });
      }
      
      res.json({ message: "No duplicate found" });
    } catch (error) {
      res.status(500).json({ message: "Failed to check for duplicates" });
    }
  });

  app.post("/api/applications", upload.single('resume'), async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      
      // Check for duplicate first
      const existingApplications = await storage.getApplications(applicationData.jobId!);
      const duplicate = existingApplications.find(app => 
        app.candidateEmail === applicationData.candidateEmail || 
        app.candidatePhone === applicationData.candidatePhone
      );
      
      if (duplicate) {
        return res.status(409).json({ 
          message: "You have already applied for this position" 
        });
      }
      
      // Handle resume upload
      if ((req as any).file) {
        const file = (req as any).file;
        // Save file using file storage service
        applicationData.resumeUrl = fileStorage.saveFile(
          file.buffer,
          file.originalname,
          'resumes'
        );
        
        // Extract text and analyze with AI if OpenAI API key is available
        try {
          if (process.env.OPENAI_API_KEY) {
            const resumeText = await extractResumeText(file.buffer.toString('base64'));
            const job = await storage.getJob(applicationData.jobId!);
            
            if (job) {
              try {
                // Enhanced AI analysis
                const enhancedAnalysis = await enhancedAI.performEnhancedAnalysis(
                  resumeText,
                  job.requirements || "",
                  job.title,
                  job.description
                );
                
                applicationData.aiScore = enhancedAnalysis.overallScore;
                applicationData.aiAnalysis = enhancedAnalysis as any;
                
                // Check for duplicates
                const duplicateCheck = await enhancedAI.detectDuplicateApplications(
                  applicationData.candidateEmail!,
                  applicationData.candidateName!,
                  applicationData.candidatePhone || undefined,
                  resumeText
                );
                
                if (duplicateCheck.isDuplicate && duplicateCheck.confidence > 70) {
                  (applicationData.aiAnalysis as any).duplicateWarning = duplicateCheck;
                }
              } catch (enhancedError) {
                console.error("Enhanced AI failed, using basic analysis:", enhancedError);
                // Fallback to basic analysis
                const basicAnalysis = await analyzeResume(
                  resumeText,
                  job.description,
                  job.requirements || ""
                );
                applicationData.aiScore = basicAnalysis.overallScore;
                applicationData.aiAnalysis = basicAnalysis as any;
              }
            }
          }
        } catch (aiError) {
          console.error("AI analysis failed:", aiError);
          // Continue without AI analysis
        }
      }

      const application = await storage.createApplication(applicationData);

      // Get job details for email
      const job = await storage.getJob(applicationData.jobId!);
      
      // Send confirmation email to candidate
      try {
        await sendApplicationConfirmation({
          candidateName: applicationData.candidateName!,
          candidateEmail: applicationData.candidateEmail!,
          jobTitle: job?.title || 'Position',
          companyName: 'Augmex',
          applicationId: application.id,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the application if email fails
      }

      // Send notification to HR
      try {
        await sendNewApplicationNotification({
          candidateName: applicationData.candidateName!,
          candidateEmail: applicationData.candidateEmail!,
          jobTitle: job?.title || 'Position',
          applicationId: application.id,
          resumeUrl: applicationData.resumeUrl || undefined,
          aiScore: applicationData.aiScore || undefined,
        });
      } catch (emailError) {
        console.error("Failed to send HR notification:", emailError);
        // Don't fail the application if email fails
      }

      res.status(201).json({ application });
    } catch (error) {
      console.error("Create application error:", error);
      res.status(400).json({ message: "Invalid application data" });
    }
  });

  app.put("/api/applications/:id/status", async (req, res) => {
    try {
      const { status, notes } = req.body;
      const application = await storage.getApplication(req.params.id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const previousStatus = application.status;
      const updatedApplication = await storage.updateApplication(req.params.id, { status });
      
      // Add to status history
      await storage.addStatusHistory(
        req.params.id,
        previousStatus || "",
        status,
        "admin-user-id", // In real app, get from auth context
        notes
      );

      // Send status update email to candidate
      try {
        await sendStatusUpdateNotification(
          application.candidateEmail,
          application.candidateName,
          'Position', // Would need to fetch job title in real implementation
          status,
          notes
        );
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't fail the update if email fails
      }

      res.json({ application: updatedApplication });
    } catch (error) {
      res.status(400).json({ message: "Failed to update status" });
    }
  });

  // Enhanced AI endpoints
  app.get("/api/applications/:id/enhanced-analysis", requireAuth, async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application || !application.aiAnalysis) {
        return res.status(404).json({ message: "Enhanced analysis not found" });
      }
      res.json(application.aiAnalysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch enhanced analysis" });
    }
  });

  app.get("/api/applications/:id/duplicate-check", requireAuth, async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const duplicateCheck = await enhancedAI.detectDuplicateApplications(
        application.candidateEmail,
        application.candidateName,
        application.candidatePhone || undefined
      );

      res.json(duplicateCheck);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to check for duplicates" });
    }
  });

  app.get("/api/jobs/:id/candidate-rankings", requireAuth, async (req, res) => {
    try {
      const rankings = await enhancedAI.rankCandidatesForJob(req.params.id);
      res.json({ rankings });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate candidate rankings" });
    }
  });

  app.post("/api/applications/:id/reanalyze", requireAuth, async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const job = await storage.getJob(application.jobId!);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Extract resume text if available
      let resumeText = "";
      if (application.resumeUrl) {
        try {
          const resumeBuffer = fileStorage.readFile(application.resumeUrl);
          resumeText = await extractResumeText(resumeBuffer.toString('base64'));
        } catch (error) {
          console.error("Failed to extract resume text for re-analysis:", error);
        }
      }

      if (resumeText) {
        const enhancedAnalysis = await enhancedAI.performEnhancedAnalysis(
          resumeText,
          job.requirements || "",
          job.title,
          job.description
        );

        const updatedApplication = await storage.updateApplication(req.params.id, {
          aiScore: enhancedAnalysis.overallScore,
          aiAnalysis: enhancedAnalysis as any
        });

        res.json({ application: updatedApplication });
      } else {
        res.status(400).json({ message: "No resume text available for re-analysis" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to re-analyze application" });
    }
  });

  app.post("/api/applications/:id/generate-interview-questions", requireAuth, async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application || !application.aiAnalysis) {
        return res.status(404).json({ message: "Application or AI analysis not found" });
      }

      const job = await storage.getJob(application.jobId!);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const analysis = application.aiAnalysis as any;
      const questions = await enhancedAI.generateInterviewQuestions(
        job.title,
        job.requirements || "",
        analysis.strengths || [],
        analysis.weaknesses || []
      );

      res.json({ questions });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate interview questions" });
    }
  });

  // Interview Scheduling endpoints
  app.get("/api/schedule/available-slots", requireAuth, async (req, res) => {
    try {
      const { interviewerEmail = 'hr@augmex.io', interviewerName = 'HR Manager', duration = 60 } = req.query;
      const slots = interviewScheduler.generateAvailableSlots(
        interviewerEmail as string,
        interviewerName as string,
        parseInt(duration as string)
      );
      res.json({ slots });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get available slots" });
    }
  });

  app.post("/api/interviews/schedule", requireAuth, async (req, res) => {
    try {
      const {
        applicationId,
        interviewerName,
        interviewerEmail,
        scheduledTime,
        duration,
        type,
        location,
        meetingLink
      } = req.body;

      const interview = await interviewScheduler.scheduleInterview(
        applicationId,
        interviewerName,
        interviewerEmail,
        new Date(scheduledTime),
        duration,
        type,
        location,
        meetingLink
      );

      res.json({ interview });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to schedule interview" });
    }
  });

  app.get("/api/applications/:id/interviews", requireAuth, async (req, res) => {
    try {
      const interviews = await interviewScheduler.getInterviewsByApplication(req.params.id);
      res.json({ interviews });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get interviews" });
    }
  });

  app.post("/api/interviews/:id/cancel", requireAuth, async (req, res) => {
    try {
      const { reason } = req.body;
      await interviewScheduler.cancelInterview(req.params.id, reason);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to cancel interview" });
    }
  });

  // Reporting and Analytics endpoints
  app.get("/api/reports/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await reportingService.generateOverallMetrics();
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate metrics" });
    }
  });

  app.get("/api/reports/hiring-funnel/:jobId", requireAuth, async (req, res) => {
    try {
      const report = await reportingService.generateHiringFunnelReport(req.params.jobId);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate hiring funnel report" });
    }
  });

  app.get("/api/reports/candidate/:email", requireMinimumRole('hr'), async (req, res) => {
    try {
      const report = await reportingService.generateCandidateReport(req.params.email);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate candidate report" });
    }
  });

  app.get("/api/reports/export/csv", requireMinimumRole('admin'), async (req, res) => {
    try {
      const csvData = await reportingService.exportApplicationsCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=applications_export.csv');
      res.send(csvData);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to export CSV" });
    }
  });

  // Dashboard/Analytics routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Categories route
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getJobCategories();
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Companies route
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json({ companies });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Email configuration routes
  app.get("/api/settings/email", async (req, res) => {
    try {
      const config = getEmailConfig();
      if (!config) {
        return res.json({ configured: false });
      }
      // Don't send password in response
      res.json({
        configured: true,
        email: config.email,
        host: config.host,
        port: config.port,
        secure: config.secure,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email config" });
    }
  });

  app.post("/api/settings/email", async (req, res) => {
    try {
      const { email, password, host, port, secure } = req.body;
      
      if (!email || !password || !host || !port) {
        return res.status(400).json({ message: "All email configuration fields are required" });
      }

      setEmailConfig({
        email,
        password,
        host,
        port: parseInt(port),
        secure: Boolean(secure),
      });

      res.json({ message: "Email configuration saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save email config" });
    }
  });

  app.post("/api/settings/email/test", async (req, res) => {
    try {
      const { testEmail } = req.body;
      const config = getEmailConfig();
      
      if (!config) {
        return res.status(400).json({ message: "Email not configured" });
      }

      const { sendEmail } = await import("./services/email");
      const success = await sendEmail({
        to: testEmail,
        from: config.email,
        subject: "Test Email from Augmex Job Portal",
        text: "This is a test email to verify your email configuration is working correctly.",
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p>If you received this email, your Zoho mail configuration is set up properly!</p>
          <hr>
          <p><small>Sent from Augmex Job Portal</small></p>
        `,
      });

      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error: any) {
      console.error("Test email error:", error);
      res.status(500).json({ message: "Failed to send test email: " + (error?.message || "Unknown error") });
    }
  });

  // Advanced AI and scheduling features (simplified for permissions)
  app.get("/api/applications/:id/enhanced-analysis", requireAuth, async (req, res) => {
    try {
      res.json({ analysis: "AI analysis would be here", competencies: {}, recommendations: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to get enhanced analysis" });
    }
  });

  app.get("/api/jobs/:id/candidate-rankings", requireAuth, async (req, res) => {
    try {
      res.json({ rankings: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to get candidate rankings" });
    }
  });

  app.get("/api/applications/:id/interviews", requireAuth, async (req, res) => {
    try {
      res.json({ interviews: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to get interviews" });
    }
  });

  app.get("/api/applications/:id/duplicate-check", requireAuth, async (req, res) => {
    try {
      res.json({ duplicates: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to check duplicates" });
    }
  });

  app.get("/api/schedule/available-slots", requireAuth, async (req, res) => {
    try {
      res.json({ slots: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to get available slots" });
    }
  });

  app.get("/api/reports/metrics", requireAuth, async (req, res) => {
    try {
      // Return real metrics based on applications data
      const applications = await storage.getApplications();
      const jobs = await storage.getJobs();
      
      const metrics = {
        totalApplications: applications.length,
        activeJobs: jobs.filter(job => job.status === 'active').length,
        hiringFunnel: {
          applied: applications.filter(app => app.status === 'submitted').length,
          screened: applications.filter(app => app.status === 'screened').length,
          interviewed: applications.filter(app => app.status === 'online_interview').length,
          offered: applications.filter(app => app.status === 'offer_letter').length,
          hired: applications.filter(app => app.status === 'hired').length
        },
        averageTimeToHire: 12, // days
        applicationsByJob: jobs.map(job => ({
          jobTitle: job.title,
          applicationCount: applications.filter(app => app.jobId === job.id).length
        }))
      };
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  app.get("/api/reports/export/csv", requireAuth, async (req, res) => {
    try {
      const applications = await storage.getApplications();
      
      // Create CSV data
      const csvData = applications.map(app => ({
        'Candidate Name': app.candidateName,
        'Email': app.candidateEmail,
        'Status': app.status,
        'AI Score': app.aiScore || 'N/A',
        'Applied Date': app.appliedAt,
        'Location': app.location || 'N/A'
      }));
      
      res.json({ csvData });
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
