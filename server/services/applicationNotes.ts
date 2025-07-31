import { storage } from "../storage";
import type { ApplicationNote, InsertApplicationNote, User } from "../../shared/schema";

export interface ApplicationNoteWithUser extends ApplicationNote {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export class ApplicationNotesService {
  private notesStore: ApplicationNote[] = [];

  // Create a new note
  async createNote(noteData: InsertApplicationNote): Promise<ApplicationNote> {
    const note: ApplicationNote = {
      id: globalThis.crypto.randomUUID(),
      applicationId: noteData.applicationId,
      userId: noteData.userId,
      note: noteData.note,
      isPrivate: noteData.isPrivate ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.notesStore.push(note);
    return note;
  }

  // Get all notes for an application
  async getNotesByApplication(applicationId: string): Promise<ApplicationNoteWithUser[]> {
    const appNotes = this.notesStore.filter(note => note.applicationId === applicationId);
    const allUsers = await storage.getUsers();
    
    const notesWithUsers = appNotes.map(note => {
      const user = allUsers.find(u => u.id === note.userId);
      return {
        ...note,
        user: user ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        } : {
          id: note.userId,
          fullName: 'Unknown User',
          email: '',
          role: '',
        }
      };
    });

    return notesWithUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get notes visible to a specific user
  async getVisibleNotes(applicationId: string, userId: string): Promise<ApplicationNoteWithUser[]> {
    const appNotes = this.notesStore.filter(note => 
      note.applicationId === applicationId && 
      (!note.isPrivate || note.userId === userId)
    );
    
    const allUsers = await storage.getUsers();
    
    const notesWithUsers = appNotes.map(note => {
      const user = allUsers.find(u => u.id === note.userId);
      return {
        ...note,
        user: user ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        } : {
          id: note.userId,
          fullName: 'Unknown User',
          email: '',
          role: '',
        }
      };
    });

    return notesWithUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Update a note
  async updateNote(
    noteId: string, 
    userId: string, 
    updates: { note: string; isPrivate?: boolean }
  ): Promise<ApplicationNote | null> {
    const noteIndex = this.notesStore.findIndex(note => 
      note.id === noteId && note.userId === userId
    );
    
    if (noteIndex === -1) return null;
    
    this.notesStore[noteIndex] = {
      ...this.notesStore[noteIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    return this.notesStore[noteIndex];
  }

  // Delete a note
  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    const noteIndex = this.notesStore.findIndex(note => 
      note.id === noteId && note.userId === userId
    );
    
    if (noteIndex === -1) return false;
    
    this.notesStore.splice(noteIndex, 1);
    return true;
  }

  // Get note by ID
  async getNoteById(noteId: string): Promise<ApplicationNote | null> {
    return this.notesStore.find(note => note.id === noteId) || null;
  }

  // Check if user can access a note
  async canUserAccessNote(noteId: string, userId: string): Promise<boolean> {
    const note = this.notesStore.find(note => note.id === noteId);
    
    if (!note) return false;
    
    // Public notes are accessible to all
    if (!note.isPrivate) return true;
    
    // Private notes are only accessible to the author
    return note.userId === userId;
  }

  // Get notes count for an application
  async getNotesCount(applicationId: string): Promise<number> {
    return this.notesStore.filter(note => note.applicationId === applicationId).length;
  }

  // Search notes by content
  async searchNotes(applicationId: string, searchTerm: string): Promise<ApplicationNoteWithUser[]> {
    const appNotes = this.notesStore.filter(note => 
      note.applicationId === applicationId && 
      note.note.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const allUsers = await storage.getUsers();
    
    const notesWithUsers = appNotes.map(note => {
      const user = allUsers.find(u => u.id === note.userId);
      return {
        ...note,
        user: user ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        } : {
          id: note.userId,
          fullName: 'Unknown User',
          email: '',
          role: '',
        }
      };
    });

    return notesWithUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get notes by user (for user activity tracking)
  async getNotesByUser(userId: string): Promise<ApplicationNoteWithUser[]> {
    const userNotes = this.notesStore.filter(note => note.userId === userId);
    const user = (await storage.getUsers()).find(u => u.id === userId);
    
    if (!user) return [];
    
    return userNotes.map(note => ({
      ...note,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      }
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get recent notes activity
  async getRecentActivity(limit = 10): Promise<ApplicationNoteWithUser[]> {
    const allUsers = await storage.getUsers();
    
    const notesWithUsers = this.notesStore.map(note => {
      const user = allUsers.find(u => u.id === note.userId);
      return {
        ...note,
        user: user ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        } : {
          id: note.userId,
          fullName: 'Unknown User',
          email: '',
          role: '',
        }
      };
    });

    return notesWithUsers
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Get notes statistics
  async getNotesStats(): Promise<{
    totalNotes: number;
    privateNotes: number;
    publicNotes: number;
    notesThisWeek: number;
    notesThisMonth: number;
    activeUsers: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalNotes = this.notesStore.length;
    const privateNotes = this.notesStore.filter(note => note.isPrivate).length;
    const publicNotes = totalNotes - privateNotes;
    const notesThisWeek = this.notesStore.filter(note => note.createdAt >= weekAgo).length;
    const notesThisMonth = this.notesStore.filter(note => note.createdAt >= monthAgo).length;
    const activeUsers = new Set(this.notesStore.map(note => note.userId)).size;

    return {
      totalNotes,
      privateNotes,
      publicNotes,
      notesThisWeek,
      notesThisMonth,
      activeUsers,
    };
  }
}

// Export singleton instance
export const applicationNotesService = new ApplicationNotesService();