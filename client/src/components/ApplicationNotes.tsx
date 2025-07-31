import { useState } from "react";
import { MessageSquare, Plus, Edit2, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ApplicationNote {
  id: string;
  applicationId: string;
  userId: string;
  note: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface ApplicationNotesProps {
  applicationId: string;
  userRole: string;
}

export function ApplicationNotes({ applicationId, userRole }: ApplicationNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notes for the application
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['/api/applications', applicationId, 'notes'],
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { note: string; isPrivate: boolean }) => {
      const response = await fetch(`/api/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note added",
        description: "Your note has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId, 'notes'] });
      setNewNote('');
      setIsPrivateNote(false);
    },
    onError: () => {
      toast({
        title: "Failed to add note",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, note, isPrivate }: { noteId: string; note: string; isPrivate: boolean }) => {
      const response = await fetch(`/api/applications/${applicationId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, isPrivate }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId, 'notes'] });
      setEditingNote(null);
      setEditNoteText('');
      setEditIsPrivate(false);
    },
    onError: () => {
      toast({
        title: "Failed to update note",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/applications/${applicationId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId, 'notes'] });
    },
    onError: () => {
      toast({
        title: "Failed to delete note",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      toast({
        title: "Note is required",
        description: "Please enter a note before submitting.",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate({
      note: newNote.trim(),
      isPrivate: isPrivateNote,
    });
  };

  const handleEditNote = (note: ApplicationNote) => {
    setEditingNote(note.id);
    setEditNoteText(note.note);
    setEditIsPrivate(note.isPrivate);
  };

  const handleUpdateNote = () => {
    if (!editNoteText.trim()) {
      toast({
        title: "Note is required",
        description: "Please enter a note before updating.",
        variant: "destructive",
      });
      return;
    }

    updateNoteMutation.mutate({
      noteId: editingNote!,
      note: editNoteText.trim(),
      isPrivate: editIsPrivate,
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'hr':
        return 'bg-blue-100 text-blue-800';
      case 'recruiter':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Application Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Application Notes ({notes.length})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note Form */}
        <form onSubmit={handleSubmitNote} className="space-y-3">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this candidate..."
            rows={3}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isPrivateNote}
                onCheckedChange={setIsPrivateNote}
              />
              <label className="text-sm text-gray-600 flex items-center">
                <Lock className="w-3 h-3 mr-1" />
                Private note (only visible to you)
              </label>
            </div>
            
            <Button 
              type="submit" 
              size="sm"
              disabled={createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Note
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notes yet. Add the first note about this candidate.</p>
            </div>
          ) : (
            notes.map((note: ApplicationNote) => (
              <div
                key={note.id}
                className={`border rounded-lg p-4 ${
                  note.isPrivate ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{note.user.fullName}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(note.user.role)}`}>
                      {note.user.role}
                    </span>
                    {note.isPrivate && (
                      <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full flex items-center">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(note.createdAt)}
                    </span>
                    {/* Only show edit/delete buttons if user is the author */}
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(note)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {editingNote === note.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editNoteText}
                      onChange={(e) => setEditNoteText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editIsPrivate}
                          onCheckedChange={setEditIsPrivate}
                        />
                        <label className="text-sm text-gray-600 flex items-center">
                          <Lock className="w-3 h-3 mr-1" />
                          Private note
                        </label>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingNote(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleUpdateNote}
                          disabled={updateNoteMutation.isPending}
                        >
                          {updateNoteMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {note.note}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}