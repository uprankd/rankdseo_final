'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Plus,
  Edit,
  Trash2,
  ListOrdered,
  Sparkles,
  Eye,
  GripVertical,
} from 'lucide-react';
import Link from 'next/link';

export default function EditOpportunityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: opportunity, isLoading, refetch } = trpc.admin.getOpportunity.useQuery({ id });
  const updateOpportunity = trpc.admin.updateOpportunity.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [formData, setFormData] = useState<any>(null);
  const [editingInstruction, setEditingInstruction] = useState<any>(null);
  const [newInstruction, setNewInstruction] = useState({
    stepOrder: 1,
    stepTitle: '',
    stepDescription: '',
    screenshotUrl: '',
    estimatedMinutes: 5,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (opportunity) {
      setFormData({
        url: opportunity.url,
        siteName: opportunity.siteName,
        shortDescription: opportunity.shortDescription,
        fullDescription: opportunity.fullDescription || '',
        category: opportunity.category,
        niche: opportunity.niche,
        language: opportunity.language,
        country: opportunity.country || '',
        linkType: opportunity.linkType,
        isFree: opportunity.isFree,
        cost: opportunity.cost || 0,
        difficultyLevel: opportunity.difficultyLevel,
        domainAuthority: opportunity.domainAuthority || 0,
        domainRating: opportunity.domainRating || 0,
        estimatedTraffic: opportunity.estimatedTraffic || 0,
        spamScore: opportunity.spamScore || 0,
        isDofollow: opportunity.isDofollow,
        status: opportunity.status,
      });
      if (opportunity.instructions && opportunity.instructions.length > 0) {
        setNewInstruction({
          ...newInstruction,
          stepOrder: opportunity.instructions.length + 1,
        });
      }
    }
  }, [opportunity]);

  const createInstruction = trpc.admin.createInstruction.useMutation({
    onSuccess: () => {
      refetch();
      setNewInstruction({
        stepOrder: (opportunity?.instructions.length || 0) + 2,
        stepTitle: '',
        stepDescription: '',
        screenshotUrl: '',
        estimatedMinutes: 5,
      });
    },
  });

  const updateInstruction = trpc.admin.updateInstruction.useMutation({
    onSuccess: () => {
      refetch();
      setEditingInstruction(null);
    },
  });

  const deleteInstruction = trpc.admin.deleteInstruction.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleUpdateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    await updateOpportunity.mutateAsync({
      id,
      ...formData,
      cost: formData.isFree ? undefined : formData.cost || undefined,
      domainAuthority: formData.domainAuthority || undefined,
      domainRating: formData.domainRating || undefined,
      estimatedTraffic: formData.estimatedTraffic || undefined,
      spamScore: formData.spamScore || undefined,
      country: formData.country || undefined,
      fullDescription: formData.fullDescription || undefined,
    });
  };

  const handleAddInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInstruction.mutateAsync({
      opportunityId: id,
      ...newInstruction,
      screenshotUrl: newInstruction.screenshotUrl || undefined,
      estimatedMinutes: newInstruction.estimatedMinutes || undefined,
    });
  };

  const handleUpdateInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstruction) return;

    await updateInstruction.mutateAsync({
      id: editingInstruction.id,
      stepOrder: editingInstruction.stepOrder,
      stepTitle: editingInstruction.stepTitle,
      stepDescription: editingInstruction.stepDescription,
      screenshotUrl: editingInstruction.screenshotUrl || undefined,
      estimatedMinutes: editingInstruction.estimatedMinutes || undefined,
    });
  };

  const handleDeleteInstruction = async (instructionId: string) => {
    if (confirm('Are you sure you want to delete this instruction step?')) {
      await deleteInstruction.mutateAsync({ id: instructionId });
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-navy-200 border-t-purple-600 rounded-full animate-spin"></div>
          <Sparkles className="h-8 w-8 text-navy-500 absolute top-6 left-6 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="border-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Edit Opportunity
            </h1>
            <p className="text-gray-600 text-sm">{opportunity?.siteName}</p>
          </div>
        </div>
        <Link href={`/opportunities/${id}`}>
          <Button variant="outline" className="border-2">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </Link>
      </div>

      <form onSubmit={handleUpdateOpportunity} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteName" className="font-semibold">Site Name *</Label>
                <Input
                  id="siteName"
                  required
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="url" className="font-semibold">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="border-2 h-11"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shortDescription" className="font-semibold">Short Description *</Label>
              <Input
                id="shortDescription"
                required
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="border-2 h-11"
              />
            </div>

            <div>
              <Label htmlFor="fullDescription" className="font-semibold">Full Description</Label>
              <Textarea
                id="fullDescription"
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                className="border-2 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category" className="font-semibold">Category *</Label>
                <Input
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="niche" className="font-semibold">Niche *</Label>
                <Input
                  id="niche"
                  required
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="linkType" className="font-semibold">Link Type *</Label>
                <Select
                  value={formData.linkType}
                  onValueChange={(value: any) => setFormData({ ...formData, linkType: value })}
                >
                  <SelectTrigger className="border-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROFILE">Profile</SelectItem>
                    <SelectItem value="DIRECTORY">Directory</SelectItem>
                    <SelectItem value="GUEST_POST">Guest Post</SelectItem>
                    <SelectItem value="FORUM">Forum</SelectItem>
                    <SelectItem value="SOCIAL">Social</SelectItem>
                    <SelectItem value="ARTICLE_SUBMISSION">Article Submission</SelectItem>
                    <SelectItem value="BLOG_COMMENT">Blog Comment</SelectItem>
                    <SelectItem value="WEB_2_0">Web 2.0</SelectItem>
                    <SelectItem value="Q_AND_A">Q&A</SelectItem>
                    <SelectItem value="BUSINESS_LISTING">Business Listing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="language" className="font-semibold">Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="country" className="font-semibold">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="status" className="font-semibold">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="border-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                    <SelectItem value="BROKEN">Broken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="domainAuthority" className="font-semibold">Domain Authority</Label>
                <Input
                  id="domainAuthority"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.domainAuthority}
                  onChange={(e) => setFormData({ ...formData, domainAuthority: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="domainRating" className="font-semibold">Domain Rating</Label>
                <Input
                  id="domainRating"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.domainRating}
                  onChange={(e) => setFormData({ ...formData, domainRating: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="difficultyLevel" className="font-semibold">Difficulty (1-5)</Label>
                <Input
                  id="difficultyLevel"
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={formData.difficultyLevel}
                  onChange={(e) => setFormData({ ...formData, difficultyLevel: parseInt(e.target.value) || 3 })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="spamScore" className="font-semibold">Spam Score</Label>
                <Input
                  id="spamScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.spamScore}
                  onChange={(e) => setFormData({ ...formData, spamScore: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="h-5 w-5"
                />
                <Label htmlFor="isFree" className="font-semibold cursor-pointer">Is Free</Label>
              </div>
              <div>
                <Label htmlFor="cost" className="font-semibold">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  disabled={formData.isFree}
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDofollow"
                  checked={formData.isDofollow}
                  onChange={(e) => setFormData({ ...formData, isDofollow: e.target.checked })}
                  className="h-5 w-5"
                />
                <Label htmlFor="isDofollow" className="font-semibold cursor-pointer">Is Dofollow</Label>
              </div>
              <div>
                <Label htmlFor="estimatedTraffic" className="font-semibold">Est. Traffic</Label>
                <Input
                  id="estimatedTraffic"
                  type="number"
                  min="0"
                  value={formData.estimatedTraffic}
                  onChange={(e) => setFormData({ ...formData, estimatedTraffic: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          type="submit"
          disabled={updateOpportunity.isPending}
          className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg h-12 font-semibold"
        >
          {updateOpportunity.isPending ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Opportunity
            </>
          )}
        </Button>
      </form>

      {/* Tutorial Instructions */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ListOrdered className="h-6 w-6 text-navy-500" />
            Tutorial Instructions
          </CardTitle>
          <CardDescription>
            Create step-by-step instructions for acquiring this backlink
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Instructions */}
          {opportunity?.instructions && opportunity.instructions.length > 0 && (
            <div className="space-y-4">
              {opportunity.instructions.map((instruction: any) => (
                <div
                  key={instruction.id}
                  className="border-2 rounded-2xl p-5 bg-gradient-to-br from-white to-purple-50"
                >
                  {editingInstruction?.id === instruction.id ? (
                    <form onSubmit={handleUpdateInstruction} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Step Order</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editingInstruction.stepOrder}
                            onChange={(e) =>
                              setEditingInstruction({
                                ...editingInstruction,
                                stepOrder: parseInt(e.target.value) || 1,
                              })
                            }
                            className="border-2 h-11"
                          />
                        </div>
                        <div>
                          <Label className="font-semibold">Estimated Minutes</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editingInstruction.estimatedMinutes || ''}
                            onChange={(e) =>
                              setEditingInstruction({
                                ...editingInstruction,
                                estimatedMinutes: parseInt(e.target.value) || undefined,
                              })
                            }
                            className="border-2 h-11"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="font-semibold">Step Title</Label>
                        <Input
                          value={editingInstruction.stepTitle}
                          onChange={(e) =>
                            setEditingInstruction({ ...editingInstruction, stepTitle: e.target.value })
                          }
                          className="border-2 h-11"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold">Step Description</Label>
                        <Textarea
                          value={editingInstruction.stepDescription}
                          onChange={(e) =>
                            setEditingInstruction({
                              ...editingInstruction,
                              stepDescription: e.target.value,
                            })
                          }
                          className="border-2 min-h-[100px]"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold">Screenshot URL (optional)</Label>
                        <Input
                          type="url"
                          value={editingInstruction.screenshotUrl || ''}
                          onChange={(e) =>
                            setEditingInstruction({
                              ...editingInstruction,
                              screenshotUrl: e.target.value,
                            })
                          }
                          className="border-2 h-11"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={updateInstruction.isPending}
                          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingInstruction(null)}
                          className="border-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          <div className="h-12 w-12 bg-gradient-to-br from-navy-500 to-sky-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                            {instruction.stepOrder}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-800 mb-2">{instruction.stepTitle}</h4>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap mb-2">
                              {instruction.stepDescription}
                            </p>
                            {instruction.estimatedMinutes && (
                              <p className="text-xs text-gray-500 font-semibold">
                                ⏱️ ~{instruction.estimatedMinutes} minutes
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingInstruction(instruction)}
                            className="border-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInstruction(instruction.id)}
                            className="border-2 border-red-200 hover:bg-red-50 hover:text-red-600"
                            disabled={deleteInstruction.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Instruction */}
          <form onSubmit={handleAddInstruction} className="border-2 border-dashed border-navy-300 rounded-2xl p-5 bg-navy-50/50">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-navy-500" />
              Add New Step
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Step Order</Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={newInstruction.stepOrder}
                    onChange={(e) =>
                      setNewInstruction({ ...newInstruction, stepOrder: parseInt(e.target.value) || 1 })
                    }
                    className="border-2 h-11"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Estimated Minutes</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newInstruction.estimatedMinutes}
                    onChange={(e) =>
                      setNewInstruction({
                        ...newInstruction,
                        estimatedMinutes: parseInt(e.target.value) || 5,
                      })
                    }
                    className="border-2 h-11"
                  />
                </div>
              </div>
              <div>
                <Label className="font-semibold">Step Title *</Label>
                <Input
                  required
                  value={newInstruction.stepTitle}
                  onChange={(e) => setNewInstruction({ ...newInstruction, stepTitle: e.target.value })}
                  className="border-2 h-11"
                  placeholder="e.g., Create an account"
                />
              </div>
              <div>
                <Label className="font-semibold">Step Description *</Label>
                <Textarea
                  required
                  value={newInstruction.stepDescription}
                  onChange={(e) => setNewInstruction({ ...newInstruction, stepDescription: e.target.value })}
                  className="border-2 min-h-[100px]"
                  placeholder="Detailed instructions for this step..."
                />
              </div>
              <div>
                <Label className="font-semibold">Screenshot URL (optional)</Label>
                <Input
                  type="url"
                  value={newInstruction.screenshotUrl}
                  onChange={(e) => setNewInstruction({ ...newInstruction, screenshotUrl: e.target.value })}
                  className="border-2 h-11"
                  placeholder="https://example.com/screenshot.png"
                />
              </div>
              <Button
                type="submit"
                disabled={createInstruction.isPending}
                className="w-full bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-600 hover:to-sky-500 text-white shadow-lg h-12 font-semibold"
              >
                {createInstruction.isPending ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Instruction Step
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
