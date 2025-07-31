import { storage } from "../storage";
import { sendEmail } from "./email";

export interface InterviewSlot {
  id: string;
  applicationId: string;
  interviewerName: string;
  interviewerEmail: string;
  candidateName: string;
  candidateEmail: string;
  scheduledTime: Date;
  duration: number; // minutes
  type: 'phone' | 'video' | 'in-person';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableTimeSlot {
  start: Date;
  end: Date;
  interviewerName: string;
  interviewerEmail: string;
}

export class InterviewScheduler {
  private interviews: Map<string, InterviewSlot> = new Map();

  // Generate available time slots for next 2 weeks (business hours only)
  generateAvailableSlots(
    interviewerEmail: string,
    interviewerName: string,
    durationMinutes: number = 60
  ): AvailableTimeSlot[] {
    const slots: AvailableTimeSlot[] = [];
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Generate slots for each business day
    for (let date = new Date(now); date <= twoWeeksFromNow; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Business hours: 9 AM to 5 PM
      for (let hour = 9; hour <= 16; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        // Skip past time slots
        if (slotStart <= now) continue;

        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
        
        // Check if slot conflicts with existing interviews
        if (!this.isSlotAvailable(interviewerEmail, slotStart, slotEnd)) {
          continue;
        }

        slots.push({
          start: slotStart,
          end: slotEnd,
          interviewerName,
          interviewerEmail
        });
      }
    }

    return slots.slice(0, 20); // Return first 20 available slots
  }

  private isSlotAvailable(interviewerEmail: string, start: Date, end: Date): boolean {
    for (const interview of this.interviews.values()) {
      if (interview.interviewerEmail !== interviewerEmail) continue;
      if (interview.status === 'cancelled') continue;

      const interviewStart = new Date(interview.scheduledTime);
      const interviewEnd = new Date(interviewStart.getTime() + interview.duration * 60 * 1000);

      // Check for overlap
      if (start < interviewEnd && end > interviewStart) {
        return false;
      }
    }
    return true;
  }

  async scheduleInterview(
    applicationId: string,
    interviewerName: string,
    interviewerEmail: string,
    scheduledTime: Date,
    duration: number = 60,
    type: 'phone' | 'video' | 'in-person' = 'video',
    location?: string,
    meetingLink?: string
  ): Promise<InterviewSlot> {
    const application = await storage.getApplication(applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const interview: InterviewSlot = {
      id: interviewId,
      applicationId,
      interviewerName,
      interviewerEmail,
      candidateName: application.candidateName,
      candidateEmail: application.candidateEmail,
      scheduledTime,
      duration,
      type,
      location,
      meetingLink,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.interviews.set(interviewId, interview);

    // Send interview invitation to candidate
    await this.sendInterviewInvitation(interview);

    // Send notification to interviewer
    await this.sendInterviewerNotification(interview);

    // Update application status
    await storage.updateApplication(applicationId, { 
      status: 'interviewed' 
    });

    return interview;
  }

  async rescheduleInterview(
    interviewId: string,
    newScheduledTime: Date,
    notes?: string
  ): Promise<InterviewSlot> {
    const interview = this.interviews.get(interviewId);
    if (!interview) {
      throw new Error("Interview not found");
    }

    const updatedInterview: InterviewSlot = {
      ...interview,
      scheduledTime: newScheduledTime,
      status: 'rescheduled',
      notes: notes || interview.notes,
      updatedAt: new Date()
    };

    this.interviews.set(interviewId, updatedInterview);

    // Send rescheduling notifications
    await this.sendRescheduleNotification(updatedInterview);

    return updatedInterview;
  }

  async cancelInterview(interviewId: string, reason?: string): Promise<void> {
    const interview = this.interviews.get(interviewId);
    if (!interview) {
      throw new Error("Interview not found");
    }

    const cancelledInterview: InterviewSlot = {
      ...interview,
      status: 'cancelled',
      notes: reason || interview.notes,
      updatedAt: new Date()
    };

    this.interviews.set(interviewId, cancelledInterview);

    // Send cancellation notifications
    await this.sendCancellationNotification(cancelledInterview, reason);
  }

  async getInterviewsByApplication(applicationId: string): Promise<InterviewSlot[]> {
    return Array.from(this.interviews.values())
      .filter(interview => interview.applicationId === applicationId)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  async getUpcomingInterviews(days: number = 7): Promise<InterviewSlot[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.interviews.values())
      .filter(interview => {
        const interviewTime = new Date(interview.scheduledTime);
        return interviewTime >= now && 
               interviewTime <= futureDate && 
               interview.status !== 'cancelled';
      })
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  private async sendInterviewInvitation(interview: InterviewSlot): Promise<void> {
    const subject = `Interview Invitation: ${interview.candidateName}`;
    const meetingDetails = this.formatMeetingDetails(interview);
    
    const candidateHtml = `
      <h2>Interview Invitation</h2>
      <p>Dear ${interview.candidateName},</p>
      <p>We are pleased to invite you for an interview regarding your application.</p>
      
      <h3>Interview Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${interview.scheduledTime.toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${interview.scheduledTime.toLocaleTimeString()}</li>
        <li><strong>Duration:</strong> ${interview.duration} minutes</li>
        <li><strong>Type:</strong> ${interview.type}</li>
        ${meetingDetails}
      </ul>
      
      <p>Please confirm your attendance by replying to this email.</p>
      <p>We look forward to speaking with you!</p>
      
      <p>Best regards,<br>The Augmex Hiring Team</p>
    `;

    try {
      await sendEmail({
        to: interview.candidateEmail,
        subject,
        html: candidateHtml
      });
    } catch (error) {
      console.error("Failed to send interview invitation:", error);
    }
  }

  private async sendInterviewerNotification(interview: InterviewSlot): Promise<void> {
    const subject = `Interview Scheduled: ${interview.candidateName}`;
    const meetingDetails = this.formatMeetingDetails(interview);
    
    const interviewerHtml = `
      <h2>Interview Scheduled</h2>
      <p>Dear ${interview.interviewerName},</p>
      <p>An interview has been scheduled with the following candidate:</p>
      
      <h3>Interview Details:</h3>
      <ul>
        <li><strong>Candidate:</strong> ${interview.candidateName}</li>
        <li><strong>Email:</strong> ${interview.candidateEmail}</li>
        <li><strong>Date:</strong> ${interview.scheduledTime.toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${interview.scheduledTime.toLocaleTimeString()}</li>
        <li><strong>Duration:</strong> ${interview.duration} minutes</li>
        <li><strong>Type:</strong> ${interview.type}</li>
        ${meetingDetails}
      </ul>
      
      <p>Please add this to your calendar and prepare accordingly.</p>
      
      <p>Best regards,<br>The Augmex Hiring System</p>
    `;

    try {
      await sendEmail({
        to: interview.interviewerEmail,
        subject,
        html: interviewerHtml
      });
    } catch (error) {
      console.error("Failed to send interviewer notification:", error);
    }
  }

  private async sendRescheduleNotification(interview: InterviewSlot): Promise<void> {
    const subject = `Interview Rescheduled: ${interview.candidateName}`;
    const meetingDetails = this.formatMeetingDetails(interview);
    
    const html = `
      <h2>Interview Rescheduled</h2>
      <p>Your interview has been rescheduled to the following time:</p>
      
      <h3>New Interview Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${interview.scheduledTime.toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${interview.scheduledTime.toLocaleTimeString()}</li>
        <li><strong>Duration:</strong> ${interview.duration} minutes</li>
        <li><strong>Type:</strong> ${interview.type}</li>
        ${meetingDetails}
      </ul>
      
      ${interview.notes ? `<p><strong>Note:</strong> ${interview.notes}</p>` : ''}
      
      <p>Please update your calendar accordingly.</p>
      
      <p>Best regards,<br>The Augmex Hiring Team</p>
    `;

    try {
      // Send to both candidate and interviewer
      await Promise.all([
        sendEmail({ to: interview.candidateEmail, subject, html }),
        sendEmail({ to: interview.interviewerEmail, subject, html })
      ]);
    } catch (error) {
      console.error("Failed to send reschedule notifications:", error);
    }
  }

  private async sendCancellationNotification(interview: InterviewSlot, reason?: string): Promise<void> {
    const subject = `Interview Cancelled: ${interview.candidateName}`;
    
    const html = `
      <h2>Interview Cancelled</h2>
      <p>We regret to inform you that the scheduled interview has been cancelled.</p>
      
      <h3>Original Interview Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${interview.scheduledTime.toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${interview.scheduledTime.toLocaleTimeString()}</li>
      </ul>
      
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      
      <p>We apologize for any inconvenience caused.</p>
      
      <p>Best regards,<br>The Augmex Hiring Team</p>
    `;

    try {
      // Send to both candidate and interviewer
      await Promise.all([
        sendEmail({ to: interview.candidateEmail, subject, html }),
        sendEmail({ to: interview.interviewerEmail, subject, html })
      ]);
    } catch (error) {
      console.error("Failed to send cancellation notifications:", error);
    }
  }

  private formatMeetingDetails(interview: InterviewSlot): string {
    switch (interview.type) {
      case 'video':
        return interview.meetingLink 
          ? `<li><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></li>`
          : '<li><strong>Meeting Link:</strong> Will be provided separately</li>';
      case 'in-person':
        return interview.location 
          ? `<li><strong>Location:</strong> ${interview.location}</li>`
          : '<li><strong>Location:</strong> To be confirmed</li>';
      case 'phone':
        return '<li><strong>Format:</strong> Phone interview - you will be contacted at the scheduled time</li>';
      default:
        return '';
    }
  }
}

export const interviewScheduler = new InterviewScheduler();