import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertApplicationSchema, insertUserSchema } from "@shared/schema";
import { analyzeResume, extractResumeText } from "./services/openai";
import { sendApplicationConfirmation, sendNewApplicationNotification, sendStatusUpdateNotification, setEmailConfig, getEmailConfig } from "./services/email";
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
  
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd use proper session management or JWT
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName, 
          role: user.role,
          avatarUrl: user.avatarUrl,
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName, 
          role: user.role,
          avatarUrl: user.avatarUrl,
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Job routes
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

  // Application routes
  app.get("/api/applications", async (req, res) => {
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
        // In a real app, you'd upload to cloud storage
        applicationData.resumeUrl = `/uploads/resumes/${file.originalname}`;
        
        // Extract text and analyze with AI if OpenAI API key is available
        try {
          if (process.env.OPENAI_API_KEY) {
            const resumeText = await extractResumeText(file.buffer.toString('base64'));
            const job = await storage.getJob(applicationData.jobId!);
            
            if (job) {
              const analysis = await analyzeResume(
                resumeText,
                job.description,
                job.requirements || ""
              );
              
              applicationData.aiScore = analysis.overallScore;
              applicationData.aiAnalysis = analysis as any;
            }
          }
        } catch (aiError) {
          console.error("AI analysis failed:", aiError);
          // Continue without AI analysis
        }
      }

      const application = await storage.createApplication(applicationData);

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
          resumeUrl: applicationData.resumeUrl,
          aiScore: applicationData.aiScore,
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
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ message: "Failed to send test email: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
