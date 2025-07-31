import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  secure: boolean;
}

// Store email configuration (in production, this would be in database)
let emailConfig: EmailConfig | null = null;

// Configure email settings
export function setEmailConfig(config: EmailConfig) {
  emailConfig = config;
}

// Get current email configuration
export function getEmailConfig(): EmailConfig | null {
  return emailConfig;
}

// Create transporter with current config
function createTransporter() {
  if (!emailConfig) {
    throw new Error('Email configuration not set');
  }

  return nodemailer.createTransporter({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure, // true for 465, false for other ports
    auth: {
      user: emailConfig.email,
      pass: emailConfig.password,
    },
  });
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

interface ApplicationEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName?: string;
  applicationId: string;
}

interface NewApplicationNotificationData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  applicationId: string;
  resumeUrl?: string;
  aiScore?: number;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!emailConfig) {
    console.warn('Email configuration not set, email not sent');
    return false;
  }

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export async function sendApplicationConfirmation(data: ApplicationEmailData): Promise<boolean> {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Confirmation - ${data.jobTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Received!</h1>
          <p>Thank you for applying to Augmex</p>
        </div>
        <div class="content">
          <h2>Hello ${data.candidateName},</h2>
          
          <p>We've successfully received your application for the <strong>${data.jobTitle}</strong> position at Augmex.</p>
          
          <div class="highlight">
            <p><strong>Application ID:</strong> ${data.applicationId}</p>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <h3>What happens next?</h3>
          <ul>
            <li>Our HR team will review your application within 2-3 business days</li>
            <li>If your profile matches our requirements, we'll reach out to schedule an interview</li>
            <li>You'll receive email updates about your application status</li>
          </ul>
          
          <p>In the meantime, feel free to explore more about Augmex and our culture on our website.</p>
          
          <a href="https://augmex.io" class="button">Visit Augmex.io</a>
          
          <p>Thank you for your interest in joining our team!</p>
          
          <p>Best regards,<br>
          The Augmex Hiring Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Augmex. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.candidateEmail,
    from: emailConfig?.email || 'career@augmex.io',
    subject: `Application Confirmation - ${data.jobTitle} at Augmex`,
    html: emailHtml,
    text: `Hello ${data.candidateName},

We've successfully received your application for the ${data.jobTitle} position at Augmex.

Application ID: ${data.applicationId}
Position: ${data.jobTitle}
Submitted: ${new Date().toLocaleDateString()}

What happens next?
- Our HR team will review your application within 2-3 business days
- If your profile matches our requirements, we'll reach out to schedule an interview
- You'll receive email updates about your application status

Thank you for your interest in joining our team!

Best regards,
The Augmex Hiring Team

This is an automated message. Please do not reply to this email.`
  });
}

export async function sendNewApplicationNotification(data: NewApplicationNotificationData): Promise<boolean> {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Application - ${data.jobTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff6b35; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .candidate-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .score { background: ${data.aiScore && data.aiScore > 80 ? '#4caf50' : data.aiScore && data.aiScore > 60 ? '#ff9800' : '#f44336'}; color: white; padding: 10px; border-radius: 6px; text-align: center; margin: 10px 0; }
        .button { background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 New Application Received</h1>
          <p>A candidate has applied for ${data.jobTitle}</p>
        </div>
        <div class="content">
          <div class="candidate-info">
            <h3>Candidate Details</h3>
            <p><strong>Name:</strong> ${data.candidateName}</p>
            <p><strong>Email:</strong> ${data.candidateEmail}</p>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Application ID:</strong> ${data.applicationId}</p>
            
            ${data.aiScore ? `
            <div class="score">
              <strong>AI Score: ${data.aiScore}/100</strong>
              <br>
              <small>${data.aiScore > 80 ? 'Strong Match' : data.aiScore > 60 ? 'Good Match' : 'Needs Review'}</small>
            </div>
            ` : ''}
          </div>
          
          <p>Please review this application in the admin dashboard.</p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/applications" class="button">Review Application</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: emailConfig?.email || 'career@augmex.io',
    from: emailConfig?.email || 'noreply@augmex.io',
    subject: `New Application: ${data.candidateName} for ${data.jobTitle}`,
    html: emailHtml,
    text: `New Application Received

Candidate: ${data.candidateName}
Email: ${data.candidateEmail}
Position: ${data.jobTitle}
Application ID: ${data.applicationId}
${data.aiScore ? `AI Score: ${data.aiScore}/100` : ''}

Please review this application in the admin dashboard.`
  });
}

export async function sendStatusUpdateNotification(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  newStatus: string,
  notes?: string
): Promise<boolean> {
  const statusMessages = {
    'screened': 'Your application has been reviewed and you\'ve passed the initial screening.',
    'interviewed': 'Congratulations! You\'ve been selected for an interview.',
    'offer': 'Great news! We\'d like to extend an offer for this position.',
    'hired': 'Welcome to the team! Your application has been approved.',
    'rejected': 'Thank you for your interest. Unfortunately, we won\'t be moving forward with your application at this time.',
  };

  const message = statusMessages[newStatus as keyof typeof statusMessages] || 'Your application status has been updated.';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Update - ${jobTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .status { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Update</h1>
          <p>${jobTitle} at Augmex</p>
        </div>
        <div class="content">
          <h2>Hello ${candidateName},</h2>
          
          <div class="status">
            <h3>Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</h3>
            <p>${message}</p>
            ${notes ? `<p><em>"${notes}"</em></p>` : ''}
          </div>
          
          <p>We appreciate your patience throughout this process. If you have any questions, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>
          The Augmex Hiring Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Augmex. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: candidateEmail,
    from: emailConfig?.email || 'career@augmex.io',
    subject: `Application Update: ${jobTitle} at Augmex`,
    html: emailHtml,
    text: `Hello ${candidateName},

Application Update for ${jobTitle} at Augmex

Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
${message}

${notes ? `Notes: ${notes}` : ''}

We appreciate your patience throughout this process.

Best regards,
The Augmex Hiring Team`
  });
}