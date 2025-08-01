import type { 
  CandidateTag, 
  ApplicationTag, 
  ApplicationRating, 
  CandidateShortlist, 
  ShortlistItem
} from "@shared/schema";

// Define interfaces for the candidate organization system
interface CandidateTagData {
  name: string;
  color: string;
  description?: string;
  createdBy: string;
}

interface ApplicationTagData {
  applicationId: string;
  tagId: string;
  addedBy: string;
}

interface ApplicationRatingData {
  applicationId: string;
  ratedBy: string;
  overallRating: number;
  technicalSkills?: number;
  communication?: number;
  experience?: number;
  culturalFit?: number;
  notes?: string;
}

interface CandidateShortlistData {
  name: string;
  description?: string;
  jobId?: string;
  createdBy: string;
  isDefault?: boolean;
}

interface ShortlistItemData {
  shortlistId: string;
  applicationId: string;
  addedBy: string;
  notes?: string;
}

// Mock storage for candidate tags (in real app, this would be in database)
const candidateTagsStorage = new Map<string, CandidateTag>();
const applicationTagsStorage = new Map<string, ApplicationTag>();
const applicationRatingsStorage = new Map<string, ApplicationRating>();
const candidateShortlistsStorage = new Map<string, CandidateShortlist>();
const shortlistItemsStorage = new Map<string, ShortlistItem>();

// Helper to generate unique IDs
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Candidate Tags Service
export class CandidateTagsService {
  static async getAllTags(): Promise<CandidateTag[]> {
    return Array.from(candidateTagsStorage.values());
  }

  static async createTag(tagData: CandidateTagData): Promise<CandidateTag> {
    const tag: CandidateTag = {
      id: generateId(),
      name: tagData.name,
      color: tagData.color,
      description: tagData.description || null,
      createdBy: tagData.createdBy,
      createdAt: new Date().toISOString(),
    };
    
    candidateTagsStorage.set(tag.id, tag);
    return tag;
  }

  static async updateTag(id: string, tagData: Partial<CandidateTagData>): Promise<CandidateTag | null> {
    const existing = candidateTagsStorage.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...tagData };
    candidateTagsStorage.set(id, updated);
    return updated;
  }

  static async deleteTag(id: string): Promise<boolean> {
    // First remove all application tags using this tag
    for (const [key, appTag] of applicationTagsStorage) {
      if (appTag.tagId === id) {
        applicationTagsStorage.delete(key);
      }
    }
    
    return candidateTagsStorage.delete(id);
  }

  static async getApplicationTags(applicationId: string): Promise<(ApplicationTag & { tag: CandidateTag })[]> {
    const result: (ApplicationTag & { tag: CandidateTag })[] = [];
    
    for (const appTag of applicationTagsStorage.values()) {
      if (appTag.applicationId === applicationId) {
        const tag = candidateTagsStorage.get(appTag.tagId);
        if (tag) {
          result.push({ ...appTag, tag });
        }
      }
    }
    
    return result;
  }

  static async addTagToApplication(tagData: ApplicationTagData): Promise<ApplicationTag> {
    // Check if tag is already applied to this application
    for (const appTag of applicationTagsStorage.values()) {
      if (appTag.applicationId === tagData.applicationId && appTag.tagId === tagData.tagId) {
        throw new Error('Tag already applied to this application');
      }
    }

    const applicationTag: ApplicationTag = {
      id: generateId(),
      applicationId: tagData.applicationId,
      tagId: tagData.tagId,
      addedBy: tagData.addedBy,
      addedAt: new Date().toISOString(),
    };
    
    applicationTagsStorage.set(applicationTag.id, applicationTag);
    return applicationTag;
  }

  static async removeTagFromApplication(applicationId: string, tagId: string): Promise<boolean> {
    for (const [key, appTag] of applicationTagsStorage) {
      if (appTag.applicationId === applicationId && appTag.tagId === tagId) {
        applicationTagsStorage.delete(key);
        return true;
      }
    }
    return false;
  }
}

// Application Ratings Service
export class ApplicationRatingsService {
  static async getRating(applicationId: string, ratedBy?: string): Promise<ApplicationRating | null> {
    for (const rating of applicationRatingsStorage.values()) {
      if (rating.applicationId === applicationId && (!ratedBy || rating.ratedBy === ratedBy)) {
        return rating;
      }
    }
    return null;
  }

  static async createOrUpdateRating(ratingData: ApplicationRatingData): Promise<ApplicationRating> {
    // Check if rating already exists
    let existingId: string | null = null;
    for (const [id, rating] of applicationRatingsStorage) {
      if (rating.applicationId === ratingData.applicationId && rating.ratedBy === ratingData.ratedBy) {
        existingId = id;
        break;
      }
    }

    if (existingId) {
      // Update existing rating
      const existing = applicationRatingsStorage.get(existingId)!;
      const updated: ApplicationRating = {
        ...existing,
        ...ratingData,
        updatedAt: new Date().toISOString(),
      };
      applicationRatingsStorage.set(existingId, updated);
      return updated;
    } else {
      // Create new rating
      const rating: ApplicationRating = {
        id: generateId(),
        applicationId: ratingData.applicationId,
        ratedBy: ratingData.ratedBy,
        overallRating: ratingData.overallRating,
        technicalSkills: ratingData.technicalSkills || null,
        communication: ratingData.communication || null,
        experience: ratingData.experience || null,
        culturalFit: ratingData.culturalFit || null,
        notes: ratingData.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      applicationRatingsStorage.set(rating.id, rating);
      return rating;
    }
  }

  static async getApplicationRatings(applicationId: string): Promise<ApplicationRating[]> {
    const ratings: ApplicationRating[] = [];
    
    for (const rating of applicationRatingsStorage.values()) {
      if (rating.applicationId === applicationId) {
        ratings.push(rating);
      }
    }
    
    return ratings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  static async deleteRating(id: string): Promise<boolean> {
    return applicationRatingsStorage.delete(id);
  }
}

// Candidate Shortlists Service
export class CandidateShortlistsService {
  static async getAllShortlists(createdBy?: string, jobId?: string): Promise<CandidateShortlist[]> {
    const shortlists: CandidateShortlist[] = [];
    
    for (const shortlist of candidateShortlistsStorage.values()) {
      if ((!createdBy || shortlist.createdBy === createdBy) && 
          (!jobId || shortlist.jobId === jobId)) {
        shortlists.push(shortlist);
      }
    }
    
    return shortlists.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async createShortlist(shortlistData: CandidateShortlistData): Promise<CandidateShortlist> {
    const shortlist: CandidateShortlist = {
      id: generateId(),
      name: shortlistData.name,
      description: shortlistData.description || null,
      jobId: shortlistData.jobId || null,
      createdBy: shortlistData.createdBy,
      isDefault: shortlistData.isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    candidateShortlistsStorage.set(shortlist.id, shortlist);
    return shortlist;
  }

  static async updateShortlist(id: string, shortlistData: Partial<CandidateShortlistData>): Promise<CandidateShortlist | null> {
    const existing = candidateShortlistsStorage.get(id);
    if (!existing) return null;
    
    const updated: CandidateShortlist = {
      ...existing,
      ...shortlistData,
      updatedAt: new Date().toISOString(),
    };
    
    candidateShortlistsStorage.set(id, updated);
    return updated;
  }

  static async deleteShortlist(id: string): Promise<boolean> {
    // First remove all shortlist items
    for (const [key, item] of shortlistItemsStorage) {
      if (item.shortlistId === id) {
        shortlistItemsStorage.delete(key);
      }
    }

    return candidateShortlistsStorage.delete(id);
  }

  static async getShortlistItems(shortlistId: string): Promise<ShortlistItem[]> {
    const items: ShortlistItem[] = [];
    
    for (const item of shortlistItemsStorage.values()) {
      if (item.shortlistId === shortlistId) {
        items.push(item);
      }
    }
    
    return items.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
  }

  static async addToShortlist(itemData: ShortlistItemData): Promise<ShortlistItem> {
    // Check if application is already in shortlist
    for (const item of shortlistItemsStorage.values()) {
      if (item.shortlistId === itemData.shortlistId && item.applicationId === itemData.applicationId) {
        throw new Error('Application already in shortlist');
      }
    }

    const item: ShortlistItem = {
      id: generateId(),
      shortlistId: itemData.shortlistId,
      applicationId: itemData.applicationId,
      addedBy: itemData.addedBy,
      addedAt: new Date().toISOString(),
      notes: itemData.notes || null,
    };
    
    shortlistItemsStorage.set(item.id, item);
    return item;
  }

  static async removeFromShortlist(shortlistId: string, applicationId: string): Promise<boolean> {
    for (const [key, item] of shortlistItemsStorage) {
      if (item.shortlistId === shortlistId && item.applicationId === applicationId) {
        shortlistItemsStorage.delete(key);
        return true;
      }
    }
    return false;
  }

  static async getApplicationShortlists(applicationId: string): Promise<(ShortlistItem & { shortlist: CandidateShortlist })[]> {
    const result: (ShortlistItem & { shortlist: CandidateShortlist })[] = [];
    
    for (const item of shortlistItemsStorage.values()) {
      if (item.applicationId === applicationId) {
        const shortlist = candidateShortlistsStorage.get(item.shortlistId);
        if (shortlist) {
          result.push({ ...item, shortlist });
        }
      }
    }
    
    return result.sort((a, b) => a.shortlist.name.localeCompare(b.shortlist.name));
  }
}