import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  User,
  Plus,
  Edit,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface InterviewSlot {
  id: string;
  applicationId: string;
  interviewerName: string;
  interviewerEmail: string;
  candidateName: string;
  candidateEmail: string;
  scheduledTime: string;
  duration: number;
  type: 'phone' | 'video' | 'in-person';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
  notes?: string;
}

interface AvailableTimeSlot {
  start: string;
  end: string;
  interviewerName: string;
  interviewerEmail: string;
}

interface InterviewSchedulerProps {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
}

export function InterviewScheduler({ applicationId, candidateName, candidateEmail }: InterviewSchedulerProps) {
  const { toast } = useToast();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);
  const [interviewDetails, setInterviewDetails] = useState({
    duration: 60,
    type: 'video' as 'phone' | 'video' | 'in-person',
    location: '',
    meetingLink: '',
    interviewerName: '',
    interviewerEmail: '',
    notes: ''
  });

  // Get existing interviews for this application
  const { data: interviews } = useQuery<{ interviews: InterviewSlot[] }>({
    queryKey: ['/api/applications', applicationId, 'interviews'],
    enabled: !!applicationId,
  });

  // Get available time slots
  const { data: availableSlots } = useQuery<{ slots: AvailableTimeSlot[] }>({
    queryKey: ['/api/schedule/available-slots'],
    enabled: isScheduleOpen,
  });

  // Schedule interview mutation
  const scheduleInterviewMutation = useMutation({
    mutationFn: async (interviewData: any) => {
      const response = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData),
      });
      if (!response.ok) throw new Error('Failed to schedule interview');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId, 'interviews'] });
      setIsScheduleOpen(false);
      toast({
        title: "Interview Scheduled",
        description: "Interview has been scheduled and invitations sent.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule interview.",
        variant: "destructive",
      });
    },
  });

  // Cancel interview mutation
  const cancelInterviewMutation = useMutation({
    mutationFn: async ({ interviewId, reason }: { interviewId: string; reason?: string }) => {
      const response = await fetch(`/api/interviews/${interviewId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to cancel interview');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId, 'interviews'] });
      toast({
        title: "Interview Cancelled",
        description: "Interview has been cancelled and notifications sent.",
      });
    },
  });

  const handleScheduleInterview = () => {
    if (!selectedTimeSlot || !interviewDetails.interviewerName || !interviewDetails.interviewerEmail) {
      toast({
        title: "Missing Information",
        description: "Please select a time slot and enter interviewer details.",
        variant: "destructive",
      });
      return;
    }

    scheduleInterviewMutation.mutate({
      applicationId,
      interviewerName: interviewDetails.interviewerName,
      interviewerEmail: interviewDetails.interviewerEmail,
      scheduledTime: selectedTimeSlot.start,
      duration: interviewDetails.duration,
      type: interviewDetails.type,
      location: interviewDetails.location,
      meetingLink: interviewDetails.meetingLink,
      notes: interviewDetails.notes
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in-person': return <MapPin className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Interview Schedule</h3>
        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Interview with {candidateName}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Selection */}
              <div className="space-y-4">
                <div>
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  />
                </div>
                
                {selectedDate && availableSlots && (
                  <div>
                    <Label>Available Time Slots</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableSlots.slots
                        .filter(slot => {
                          const slotDate = new Date(slot.start);
                          return slotDate.toDateString() === selectedDate.toDateString();
                        })
                        .map((slot, index) => (
                          <div
                            key={index}
                            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                              selectedTimeSlot === slot ? 'border-blue-500 bg-blue-50' : ''
                            }`}
                            onClick={() => setSelectedTimeSlot(slot)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-xs text-gray-500">{slot.interviewerName}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interview Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="interviewer-name">Interviewer Name</Label>
                    <Input
                      id="interviewer-name"
                      value={interviewDetails.interviewerName}
                      onChange={(e) => setInterviewDetails(prev => ({ ...prev, interviewerName: e.target.value }))}
                      placeholder="Enter interviewer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="interviewer-email">Interviewer Email</Label>
                    <Input
                      id="interviewer-email"
                      type="email"
                      value={interviewDetails.interviewerEmail}
                      onChange={(e) => setInterviewDetails(prev => ({ ...prev, interviewerEmail: e.target.value }))}
                      placeholder="Enter interviewer email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Select 
                      value={interviewDetails.duration.toString()} 
                      onValueChange={(value) => setInterviewDetails(prev => ({ ...prev, duration: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Interview Type</Label>
                    <Select 
                      value={interviewDetails.type} 
                      onValueChange={(value: 'phone' | 'video' | 'in-person') => setInterviewDetails(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video Call</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="in-person">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {interviewDetails.type === 'video' && (
                  <div>
                    <Label htmlFor="meeting-link">Meeting Link</Label>
                    <Input
                      id="meeting-link"
                      value={interviewDetails.meetingLink}
                      onChange={(e) => setInterviewDetails(prev => ({ ...prev, meetingLink: e.target.value }))}
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                )}

                {interviewDetails.type === 'in-person' && (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={interviewDetails.location}
                      onChange={(e) => setInterviewDetails(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Office address or room number"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={interviewDetails.notes}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional interview notes or instructions"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleScheduleInterview}
                    disabled={scheduleInterviewMutation.isPending}
                  >
                    {scheduleInterviewMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Interviews */}
      <div className="space-y-3">
        {interviews?.interviews && interviews.interviews.length > 0 ? (
          interviews.interviews.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(interview.type)}
                      <span className="font-medium">
                        {new Date(interview.scheduledTime).toLocaleDateString()} at{' '}
                        {new Date(interview.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Badge className={getStatusColor(interview.status)}>
                        {interview.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Interviewer: {interview.interviewerName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Duration: {interview.duration} minutes
                      </div>
                      {interview.meetingLink && (
                        <div className="mt-1">
                          <a 
                            href={interview.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Join Meeting
                          </a>
                        </div>
                      )}
                      {interview.location && (
                        <div className="text-xs text-gray-500">
                          Location: {interview.location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    {interview.status !== 'cancelled' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => cancelInterviewMutation.mutate({ interviewId: interview.id })}
                        disabled={cancelInterviewMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {interview.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <strong>Notes:</strong> {interview.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No interviews scheduled yet</p>
          </div>
        )}
      </div>
    </div>
  );
}