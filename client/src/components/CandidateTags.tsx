import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tags, Plus, Edit, Trash2, X } from "lucide-react";
import type { CandidateTag, ApplicationTag } from "@shared/schema";

interface CandidateTagsProps {
  applicationId?: string;
  showCreateForm?: boolean;
}

interface ApplicationTagsProps {
  applicationId: string;
  onTagsChange?: () => void;
}

// Color picker component
const ColorPicker = ({ value, onChange }: { value: string; onChange: (color: string) => void }) => {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e", "#64748b", "#6b7280", "#374151"
  ];

  return (
    <div className="grid grid-cols-10 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={`w-6 h-6 rounded-full border-2 ${
            value === color ? "border-gray-900" : "border-gray-300"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
};

// Create/Edit Tag Modal
const TagFormModal = ({ 
  tag, 
  onClose, 
  onSuccess 
}: { 
  tag?: CandidateTag; 
  onClose: () => void; 
  onSuccess: () => void; 
}) => {
  const [name, setName] = useState(tag?.name || "");
  const [color, setColor] = useState(tag?.color || "#3b82f6");
  const [description, setDescription] = useState(tag?.description || "");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { name: string; color: string; description: string }) => {
      const endpoint = tag ? `/api/candidate-tags/${tag.id}` : "/api/candidate-tags";
      const method = tag ? "PUT" : "POST";
      return apiRequest(endpoint, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      toast({
        title: tag ? "Tag updated" : "Tag created",
        description: `Tag "${name}" has been ${tag ? "updated" : "created"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-tags"] });
      onSuccess();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${tag ? "update" : "create"} tag.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a tag name.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ name: name.trim(), color, description: description.trim() });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag ? "Edit Tag" : "Create New Tag"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tag Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : (tag ? "Update" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Tags Management Component
export function CandidateTags({ showCreateForm = true }: CandidateTagsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<CandidateTag | null>(null);
  const { toast } = useToast();

  const { data: tagsData, isLoading } = useQuery({
    queryKey: ["/api/candidate-tags"],
    queryFn: () => apiRequest("/api/candidate-tags"),
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest(`/api/candidate-tags/${tagId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({
        title: "Tag deleted",
        description: "Tag has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-tags"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tag.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading tags...</div>;
  }

  const tags = tagsData?.tags || [];

  return (
    <div className="space-y-4">
      {showCreateForm && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Candidate Tags
          </h3>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
        </div>
      )}

      {tags.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <Tags className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No candidate tags created yet.</p>
            {showCreateForm && (
              <Button 
                onClick={() => setShowCreateModal(true)} 
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Tag
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag: CandidateTag) => (
            <Card key={tag.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge 
                      style={{ backgroundColor: tag.color, color: "white" }}
                      className="mb-2"
                    >
                      {tag.name}
                    </Badge>
                    {tag.description && (
                      <p className="text-sm text-gray-600 mb-2">{tag.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Created {new Date(tag.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingTag(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTagMutation.mutate(tag.id)}
                      disabled={deleteTagMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <TagFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {editingTag && (
        <TagFormModal
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSuccess={() => setEditingTag(null)}
        />
      )}
    </div>
  );
}

// Application Tags Component
export function ApplicationTags({ applicationId, onTagsChange }: ApplicationTagsProps) {
  const [showAddTag, setShowAddTag] = useState(false);
  const { toast } = useToast();

  const { data: applicationTagsData, isLoading: loadingAppTags } = useQuery({
    queryKey: ["/api/applications", applicationId, "tags"],
    queryFn: () => apiRequest(`/api/applications/${applicationId}/tags`),
  });

  const { data: allTagsData } = useQuery({
    queryKey: ["/api/candidate-tags"],
    queryFn: () => apiRequest("/api/candidate-tags"),
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest(`/api/applications/${applicationId}/tags`, {
        method: "POST",
        body: JSON.stringify({ tagId }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Tag added",
        description: "Tag has been added to the application.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "tags"] });
      onTagsChange?.();
      setShowAddTag(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add tag.",
        variant: "destructive",
      });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest(`/api/applications/${applicationId}/tags/${tagId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Tag removed",
        description: "Tag has been removed from the application.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "tags"] });
      onTagsChange?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove tag.",
        variant: "destructive",
      });
    },
  });

  if (loadingAppTags) {
    return <div className="text-sm text-gray-500">Loading tags...</div>;
  }

  const applicationTags = applicationTagsData?.tags || [];
  const allTags = allTagsData?.tags || [];
  const appliedTagIds = new Set(applicationTags.map((appTag: ApplicationTag & { tag: CandidateTag }) => appTag.tag.id));
  const availableTags = allTags.filter((tag: CandidateTag) => !appliedTagIds.has(tag.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Tags</h4>
        {availableTags.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddTag(!showAddTag)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Tag
          </Button>
        )}
      </div>

      {applicationTags.length === 0 && !showAddTag ? (
        <p className="text-sm text-gray-500">No tags applied</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {applicationTags.map((appTag: ApplicationTag & { tag: CandidateTag }) => (
            <Badge
              key={appTag.id}
              style={{ backgroundColor: appTag.tag.color, color: "white" }}
              className="flex items-center gap-1"
            >
              {appTag.tag.name}
              <button
                onClick={() => removeTagMutation.mutate(appTag.tag.id)}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                disabled={removeTagMutation.isPending}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {showAddTag && availableTags.length > 0 && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <p className="text-sm font-medium mb-2">Available Tags:</p>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag: CandidateTag) => (
              <button
                key={tag.id}
                onClick={() => addTagMutation.mutate(tag.id)}
                disabled={addTagMutation.isPending}
                className="inline-flex items-center px-2 py-1 rounded text-sm hover:opacity-80 transition-opacity"
                style={{ backgroundColor: tag.color, color: "white" }}
              >
                <Plus className="h-3 w-3 mr-1" />
                {tag.name}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setShowAddTag(false)}
          >
            Done
          </Button>
        </div>
      )}

      {availableTags.length === 0 && applicationTags.length === 0 && (
        <p className="text-sm text-gray-500">No tags available. Create some tags first.</p>
      )}
    </div>
  );
}