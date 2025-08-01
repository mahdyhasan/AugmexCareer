import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, Plus, Edit, Trash2 } from "lucide-react";
import type { ApplicationRating } from "@shared/schema";

interface ApplicationRatingProps {
  applicationId: string;
  onRatingChange?: () => void;
}

interface RatingFormData {
  overallRating: number;
  technicalSkills: number;
  communication: number;
  experience: number;
  culturalFit: number;
  notes: string;
}

// Star Rating Component
const StarRating = ({ 
  value, 
  onChange, 
  readonly = false,
  size = "sm" 
}: { 
  value: number; 
  onChange?: (rating: number) => void; 
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(rating)}
          className={`${sizeClasses[size]} ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          } transition-transform`}
        >
          <Star
            className={`w-full h-full ${
              rating <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Rating Form Modal
const RatingFormModal = ({
  applicationId,
  rating,
  onClose,
  onSuccess,
}: {
  applicationId: string;
  rating?: ApplicationRating;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState<RatingFormData>({
    overallRating: rating?.overallRating || 0,
    technicalSkills: rating?.technicalSkills || 0,
    communication: rating?.communication || 0,
    experience: rating?.experience || 0,
    culturalFit: rating?.culturalFit || 0,
    notes: rating?.notes || "",
  });

  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: RatingFormData) => {
      return apiRequest(`/api/applications/${applicationId}/ratings`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating saved",
        description: "Application rating has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "ratings"] });
      onSuccess();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save rating.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.overallRating === 0) {
      toast({
        title: "Overall rating required",
        description: "Please provide an overall rating.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  const updateRating = (field: keyof RatingFormData, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {rating ? "Update Rating" : "Rate Application"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-3">
              <StarRating
                value={formData.overallRating}
                onChange={(rating) => updateRating("overallRating", rating)}
                size="lg"
              />
              <span className="text-sm text-gray-600">
                {formData.overallRating > 0 ? `${formData.overallRating}/5` : "Not rated"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Technical Skills
              </label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={formData.technicalSkills}
                  onChange={(rating) => updateRating("technicalSkills", rating)}
                />
                <span className="text-sm text-gray-600">
                  {formData.technicalSkills > 0 ? `${formData.technicalSkills}/5` : "Not rated"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Communication
              </label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={formData.communication}
                  onChange={(rating) => updateRating("communication", rating)}
                />
                <span className="text-sm text-gray-600">
                  {formData.communication > 0 ? `${formData.communication}/5` : "Not rated"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Experience
              </label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={formData.experience}
                  onChange={(rating) => updateRating("experience", rating)}
                />
                <span className="text-sm text-gray-600">
                  {formData.experience > 0 ? `${formData.experience}/5` : "Not rated"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cultural Fit
              </label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={formData.culturalFit}
                  onChange={(rating) => updateRating("culturalFit", rating)}
                />
                <span className="text-sm text-gray-600">
                  {formData.culturalFit > 0 ? `${formData.culturalFit}/5` : "Not rated"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => updateRating("notes", e.target.value)}
              placeholder="Optional notes about this candidate..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Rating"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Application Rating Component
export function ApplicationRating({ applicationId, onRatingChange }: ApplicationRatingProps) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [editingRating, setEditingRating] = useState<ApplicationRating | null>(null);
  const { toast } = useToast();

  const { data: ratingsData, isLoading } = useQuery({
    queryKey: ["/api/applications", applicationId, "ratings"],
    queryFn: () => apiRequest(`/api/applications/${applicationId}/ratings`),
  });

  const deleteRatingMutation = useMutation({
    mutationFn: async (ratingId: string) => {
      return apiRequest(`/api/applications/${applicationId}/ratings/${ratingId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating deleted",
        description: "Rating has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "ratings"] });
      onRatingChange?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete rating.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading ratings...</div>;
  }

  const ratings = ratingsData?.ratings || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4" />
          Ratings & Reviews
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRatingModal(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Rating
        </Button>
      </div>

      {ratings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No ratings yet</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRatingModal(true)}
              className="mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add First Rating
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ratings.map((rating: ApplicationRating) => (
            <Card key={rating.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StarRating value={rating.overallRating} readonly size="md" />
                    <span className="font-medium">{rating.overallRating}/5</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingRating(rating)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRatingMutation.mutate(rating.id)}
                      disabled={deleteRatingMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Detailed Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  {rating.technicalSkills && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Technical</p>
                      <StarRating value={rating.technicalSkills} readonly />
                    </div>
                  )}
                  {rating.communication && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Communication</p>
                      <StarRating value={rating.communication} readonly />
                    </div>
                  )}
                  {rating.experience && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Experience</p>
                      <StarRating value={rating.experience} readonly />
                    </div>
                  )}
                  {rating.culturalFit && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Cultural Fit</p>
                      <StarRating value={rating.culturalFit} readonly />
                    </div>
                  )}
                </div>

                {rating.notes && (
                  <div>
                    <p className="text-sm text-gray-700">{rating.notes}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Rated on {new Date(rating.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showRatingModal && (
        <RatingFormModal
          applicationId={applicationId}
          onClose={() => setShowRatingModal(false)}
          onSuccess={() => {
            setShowRatingModal(false);
            onRatingChange?.();
          }}
        />
      )}

      {editingRating && (
        <RatingFormModal
          applicationId={applicationId}
          rating={editingRating}
          onClose={() => setEditingRating(null)}
          onSuccess={() => {
            setEditingRating(null);
            onRatingChange?.();
          }}
        />
      )}
    </div>
  );
}