import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Plus, Edit, Trash2, Users, Star } from "lucide-react";
import type { CandidateShortlist, ShortlistItem } from "@shared/schema";

interface CandidateShortlistsProps {
  jobId?: string;
  showCreateForm?: boolean;
}

interface ApplicationShortlistsProps {
  applicationId: string;
  onShortlistsChange?: () => void;
}

interface ShortlistFormData {
  name: string;
  description: string;
  jobId?: string;
  isDefault: boolean;
}

// Create/Edit Shortlist Modal
const ShortlistFormModal = ({
  shortlist,
  jobId,
  onClose,
  onSuccess,
}: {
  shortlist?: CandidateShortlist;
  jobId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState<ShortlistFormData>({
    name: shortlist?.name || "",
    description: shortlist?.description || "",
    jobId: shortlist?.jobId || jobId,
    isDefault: shortlist?.isDefault || false,
  });

  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: ShortlistFormData) => {
      const endpoint = shortlist ? `/api/shortlists/${shortlist.id}` : "/api/shortlists";
      const method = shortlist ? "PUT" : "POST";
      return apiRequest(endpoint, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      toast({
        title: shortlist ? "Shortlist updated" : "Shortlist created",
        description: `Shortlist "${formData.name}" has been ${shortlist ? "updated" : "created"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shortlists"] });
      onSuccess();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${shortlist ? "update" : "create"} shortlist.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a shortlist name.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  const updateFormData = (field: keyof ShortlistFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {shortlist ? "Edit Shortlist" : "Create New Shortlist"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Shortlist Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="Enter shortlist name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => updateFormData("isDefault", e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isDefault" className="text-sm">
              Set as default shortlist
            </label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : (shortlist ? "Update" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Shortlists Management Component
export function CandidateShortlists({ jobId, showCreateForm = true }: CandidateShortlistsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShortlist, setEditingShortlist] = useState<CandidateShortlist | null>(null);
  const [selectedShortlist, setSelectedShortlist] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: shortlistsData, isLoading } = useQuery({
    queryKey: ["/api/shortlists", jobId || "all"],
    queryFn: () => apiRequest(`/api/shortlists${jobId ? `?jobId=${jobId}` : ""}`),
  });

  const { data: shortlistItemsData } = useQuery({
    queryKey: ["/api/shortlists", selectedShortlist, "items"],
    queryFn: () => selectedShortlist ? apiRequest(`/api/shortlists/${selectedShortlist}/items`) : null,
    enabled: !!selectedShortlist,
  });

  const deleteShortlistMutation = useMutation({
    mutationFn: async (shortlistId: string) => {
      return apiRequest(`/api/shortlists/${shortlistId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({
        title: "Shortlist deleted",
        description: "Shortlist has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shortlists"] });
      if (selectedShortlist) {
        setSelectedShortlist(null);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete shortlist.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading shortlists...</div>;
  }

  const shortlists = shortlistsData?.shortlists || [];
  const shortlistItems = shortlistItemsData?.items || [];

  return (
    <div className="space-y-6">
      {showCreateForm && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Candidate Shortlists
            {jobId && <Badge variant="outline">Job-specific</Badge>}
          </h3>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Shortlist
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shortlists List */}
        <div className="space-y-4">
          <h4 className="font-medium">Your Shortlists</h4>
          
          {shortlists.length === 0 ? (
            <Card>
              <CardContent className="text-center py-6">
                <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No shortlists created yet.</p>
                {showCreateForm && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Shortlist
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shortlists.map((shortlist: CandidateShortlist) => (
                <Card
                  key={shortlist.id}
                  className={`cursor-pointer transition-colors ${
                    selectedShortlist === shortlist.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedShortlist(shortlist.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{shortlist.name}</h5>
                          {shortlist.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        {shortlist.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {shortlist.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            0 candidates
                          </span>
                          <span>
                            Created {new Date(shortlist.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingShortlist(shortlist);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteShortlistMutation.mutate(shortlist.id);
                          }}
                          disabled={deleteShortlistMutation.isPending}
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
        </div>

        {/* Shortlist Details */}
        <div className="space-y-4">
          {selectedShortlist ? (
            <div>
              <h4 className="font-medium mb-4">Shortlist Contents</h4>
              {shortlistItems.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No candidates in this shortlist yet.</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Add candidates from their application pages.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {shortlistItems.map((item: ShortlistItem) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h6 className="font-medium">Candidate #{item.applicationId.slice(-8)}</h6>
                            {item.notes && (
                              <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Added {new Date(item.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Select a shortlist to view its contents</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCreateModal && (
        <ShortlistFormModal
          jobId={jobId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {editingShortlist && (
        <ShortlistFormModal
          shortlist={editingShortlist}
          onClose={() => setEditingShortlist(null)}
          onSuccess={() => setEditingShortlist(null)}
        />
      )}
    </div>
  );
}

// Application Shortlists Component
export function ApplicationShortlists({ applicationId, onShortlistsChange }: ApplicationShortlistsProps) {
  const [showAddToShortlist, setShowAddToShortlist] = useState(false);
  const [selectedShortlistId, setSelectedShortlistId] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const { data: applicationShortlistsData, isLoading: loadingAppShortlists } = useQuery({
    queryKey: ["/api/applications", applicationId, "shortlists"],
    queryFn: () => apiRequest(`/api/applications/${applicationId}/shortlists`),
  });

  const { data: allShortlistsData } = useQuery({
    queryKey: ["/api/shortlists"],
    queryFn: () => apiRequest("/api/shortlists"),
  });

  const addToShortlistMutation = useMutation({
    mutationFn: async (data: { shortlistId: string; notes: string }) => {
      return apiRequest(`/api/shortlists/${data.shortlistId}/items`, {
        method: "POST",
        body: JSON.stringify({ applicationId, notes: data.notes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to shortlist",
        description: "Application has been added to the shortlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "shortlists"] });
      onShortlistsChange?.();
      setShowAddToShortlist(false);
      setSelectedShortlistId("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to shortlist.",
        variant: "destructive",
      });
    },
  });

  const removeFromShortlistMutation = useMutation({
    mutationFn: async (shortlistId: string) => {
      return apiRequest(`/api/shortlists/${shortlistId}/items/${applicationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Removed from shortlist",
        description: "Application has been removed from the shortlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "shortlists"] });
      onShortlistsChange?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from shortlist.",
        variant: "destructive",
      });
    },
  });

  if (loadingAppShortlists) {
    return <div className="text-sm text-gray-500">Loading shortlists...</div>;
  }

  const applicationShortlists = applicationShortlistsData?.shortlists || [];
  const allShortlists = allShortlistsData?.shortlists || [];
  const shortlistedIds = new Set(applicationShortlists.map((item: ShortlistItem & { shortlist: CandidateShortlist }) => item.shortlist.id));
  const availableShortlists = allShortlists.filter((shortlist: CandidateShortlist) => !shortlistedIds.has(shortlist.id));

  const handleAddToShortlist = () => {
    if (!selectedShortlistId) {
      toast({
        title: "Select shortlist",
        description: "Please select a shortlist.",
        variant: "destructive",
      });
      return;
    }
    addToShortlistMutation.mutate({ shortlistId: selectedShortlistId, notes: notes.trim() });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Shortlists</h4>
        {availableShortlists.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddToShortlist(!showAddToShortlist)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add to Shortlist
          </Button>
        )}
      </div>

      {applicationShortlists.length === 0 && !showAddToShortlist ? (
        <p className="text-sm text-gray-500">Not in any shortlists</p>
      ) : (
        <div className="space-y-2">
          {applicationShortlists.map((item: ShortlistItem & { shortlist: CandidateShortlist }) => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{item.shortlist.name}</span>
                  {item.shortlist.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                {item.notes && (
                  <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFromShortlistMutation.mutate(item.shortlist.id)}
                disabled={removeFromShortlistMutation.isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showAddToShortlist && availableShortlists.length > 0 && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Select Shortlist:</label>
            <select
              value={selectedShortlistId}
              onChange={(e) => setSelectedShortlistId(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">Choose a shortlist...</option>
              {availableShortlists.map((shortlist: CandidateShortlist) => (
                <option key={shortlist.id} value={shortlist.id}>
                  {shortlist.name} {shortlist.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional):</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about why this candidate is shortlisted..."
              rows={2}
              className="text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddToShortlist}
              disabled={addToShortlistMutation.isPending || !selectedShortlistId}
            >
              {addToShortlistMutation.isPending ? "Adding..." : "Add to Shortlist"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddToShortlist(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {availableShortlists.length === 0 && applicationShortlists.length === 0 && (
        <p className="text-sm text-gray-500">No shortlists available. Create some shortlists first.</p>
      )}
    </div>
  );
}