import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, jsonb, decimal, date, integer, boolean, inet } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("candidate"), // admin, hr, recruiter, candidate
  avatarUrl: varchar("avatar_url", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  size: varchar("size", { length: 50 }),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const jobCategories = pgTable("job_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id),
  categoryId: uuid("category_id").references(() => jobCategories.id),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  benefits: text("benefits"),
  employmentType: varchar("employment_type", { length: 50 }).notNull(), // full-time, part-time, contract, intern
  experienceLevel: varchar("experience_level", { length: 50 }).notNull(), // entry, mid, senior, lead, executive
  location: varchar("location", { length: 255 }),
  remoteType: varchar("remote_type", { length: 50 }), // on-site, remote, hybrid
  salaryMin: decimal("salary_min", { precision: 10, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  skills: jsonb("skills"), // Array of required skills
  applicationDeadline: date("application_deadline"),
  status: varchar("status", { length: 50 }).default("active"), // active, paused, closed, draft
  applicationFormConfig: jsonb("application_form_config"), // Dynamic form configuration
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").references(() => jobs.id),
  candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
  candidateName: varchar("candidate_name", { length: 255 }).notNull(),
  candidatePhone: varchar("candidate_phone", { length: 20 }),
  location: varchar("location", { length: 255 }),
  currentCompany: varchar("current_company", { length: 255 }),
  currentRole: varchar("current_role", { length: 255 }),
  timeWithCurrentCompany: varchar("time_with_current_company", { length: 100 }),
  yearsOfExperience: varchar("years_of_experience", { length: 50 }),
  linkedinProfile: varchar("linkedin_profile", { length: 500 }),
  gitProfile: varchar("git_profile", { length: 500 }),
  resumeUrl: varchar("resume_url", { length: 255 }),
  coverLetter: text("cover_letter"),
  applicationData: jsonb("application_data"), // Dynamic form responses
  parsedResumeData: jsonb("parsed_resume_data"), // Auto-extracted resume data
  linkedinData: jsonb("linkedin_data"), // LinkedIn profile data
  status: varchar("status", { length: 50 }).default("submitted"), // submitted, screened, assessed, online_interview, physical_interview, mock_call, offer_letter, negotiation, hired, rejected
  aiScore: integer("ai_score"), // AI screening score (0-100)
  aiAnalysis: jsonb("ai_analysis"), // AI analysis details
  appliedAt: timestamp("applied_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const applicationStatusHistory = pgTable("application_status_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }).notNull(),
  notes: text("notes"),
  changedBy: uuid("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at").default(sql`NOW()`),
});

export const savedJobs = pgTable("saved_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  jobId: uuid("job_id").references(() => jobs.id),
  savedAt: timestamp("saved_at").default(sql`NOW()`),
});

export const jobViews = pgTable("job_views", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").references(() => jobs.id),
  userId: uuid("user_id").references(() => users.id), // NULL for anonymous views
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at").default(sql`NOW()`),
});

export const jobAlerts = pgTable("job_alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  keywords: text("keywords"), // Comma-separated keywords
  location: varchar("location", { length: 255 }),
  employmentType: varchar("employment_type", { length: 50 }),
  experienceLevel: varchar("experience_level", { length: 50 }),
  categoryId: uuid("category_id").references(() => jobCategories.id),
  isActive: boolean("is_active").default(true),
  lastSent: timestamp("last_sent"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const applicationNotes = pgTable("application_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  note: text("note").notNull(),
  isPrivate: boolean("is_private").default(false), // Private notes only visible to author
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertJobAlertSchema = createInsertSchema(jobAlerts).omit({
  id: true,
  createdAt: true,
  lastSent: true,
});

export const insertApplicationNoteSchema = createInsertSchema(applicationNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobCategorySchema = createInsertSchema(jobCategories).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertJobAlert = z.infer<typeof insertJobAlertSchema>;
export type InsertApplicationNote = z.infer<typeof insertApplicationNoteSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;


export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type JobAlert = typeof jobAlerts.$inferSelect;
export type ApplicationNote = typeof applicationNotes.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type JobCategory = typeof jobCategories.$inferSelect;

export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;
export type SavedJob = typeof savedJobs.$inferSelect;
export type JobView = typeof jobViews.$inferSelect;
