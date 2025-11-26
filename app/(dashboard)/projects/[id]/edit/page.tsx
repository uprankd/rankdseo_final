'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Edit,
} from 'lucide-react';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);

  const utils = trpc.useUtils();
  
  const { data: project, isLoading } = trpc.project.getById.useQuery({ id: projectId });
  const { data: allOpportunities } = trpc.opportunity.list.useQuery({ limit: 100 });

  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success('✅ Project updated!');
      utils.project.getById.invalidate({ id: projectId });
    },
  });

  const addOpportunity = trpc.project.addOpportunity.useMutation({
    onSuccess: () => {
      toast.success('✅ Opportunity added!');
      setIsAddDialogOpen(false);
      setSearchQuery('');
      utils.project.getById.invalidate({ id: projectId });
    },
  });

  const removeOpportunity = trpc.project.removeOpportunity.useMutation({
    onSuccess: () => {
      toast.success('🗑️ Opportunity removed!');
      utils.project.getById.invalidate({ id: projectId });
    },
  });

  const updateStatus = trpc.project.updateOpportunityStatus.useMutation({
    onSuccess: () => {
      toast.success('✅ Status updated!');
      utils.project.getById.invalidate({ id: projectId });
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    niche: '',
    description: '',
  });

  // Update form data when project loads
  if (project && formData.name === '') {
    setFormData({
      name: project.name,
      domain: project.domain || '',
      niche: project.niche || '',
      description: project.description || '',
    });
  }

  const handleSave = () => {
    updateProject.mutate({ id: projectId, ...formData });
  };

  const handleRemoveOpportunity = (opportunityId: string, name: string) => {
    if (confirm(`Remove "${name}" from this project?`)) {
      removeOpportunity.mutate({ projectId, opportunityId });
    }
  };

  const handleAddOpportunity = (opportunityId: string) => {
    addOpportunity.mutate({ projectId, opportunityId, priority: 3 });
  };

  const handleStatusChange = (opportunityId: string, status: string) => {
    updateStatus.mutate({ projectId, opportunityId, status: status as any });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-navy-200 border-t-purple-600 rounded-full animate-spin"></div>
          <Sparkles className="h-8 w-8 text-navy-500 absolute top-6 left-6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
        <Link href="/projects">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  // Get existing opportunity IDs
  const existingOpportunityIds = new Set(
    project.opportunities?.map((po: any) => po.opportunityId) || []
  );

  // Filter available opportunities
  const availableOpportunities = allOpportunities?.opportunities.filter(
    (opp: any) => !existingOpportunityIds.has(opp.id) && 
      opp.siteName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="icon" className="border-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-navy-500 to-sky-500 bg-clip-text text-transparent">
            Edit Project
          </h1>
          <p className="text-gray-600 text-sm">Manage project details and opportunities</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateProject.isPending}
          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-lg"
        >
          <Save className="h-5 w-5 mr-2" />
          {updateProject.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Project Details */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-6 w-6 text-blue-600" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="font-semibold">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="domain" className="font-semibold">Domain</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="border-2 h-11"
                placeholder="example.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="niche" className="font-semibold">Niche</Label>
            <Input
              id="niche"
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              className="border-2 h-11"
              placeholder="Technology, Health, Finance..."
            />
          </div>
          <div>
            <Label htmlFor="description" className="font-semibold">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-2 min-h-[100px]"
              placeholder="Describe your backlink building goals..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Manage Opportunities */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Manage Opportunities ({project.opportunities?.length || 0})
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Opportunity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Opportunity to Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Search Opportunities</Label>
                    <Input
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-2"
                    />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {availableOpportunities.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        {searchQuery ? 'No matching opportunities found' : 'All opportunities already added'}
                      </p>
                    ) : (
                      availableOpportunities.map((opp: any) => (
                        <div
                          key={opp.id}
                          className="border-2 rounded-lg p-3 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">{opp.siteName}</h4>
                              <p className="text-sm text-gray-600">{opp.category}</p>
                              <div className="flex gap-2 mt-1">
                                {opp.domainAuthority && (
                                  <Badge variant="outline" className="text-xs">DA: {opp.domainAuthority}</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">{opp.linkType}</Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddOpportunity(opp.id)}
                              disabled={addOpportunity.isPending}
                              className="bg-gradient-to-r from-green-500 to-teal-500"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!project.opportunities || project.opportunities.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold text-lg">No opportunities added yet</p>
              <p className="text-gray-500 text-sm mb-4">Add your first opportunity to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.opportunities.map((po: any) => (
                <div
                  key={po.id}
                  className="border-2 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-800">{po.opportunity.siteName}</h3>
                        {po.opportunity.domainAuthority && (
                          <Badge variant="outline" className="border-2">DA: {po.opportunity.domainAuthority}</Badge>
                        )}
                        <Badge className="bg-navy-100 text-navy-600 border-2 border-navy-300">
                          {po.opportunity.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{po.opportunity.shortDescription}</p>
                      <div className="flex items-center gap-3">
                        <Label className="text-sm font-semibold">Status:</Label>
                        <Select
                          value={po.status}
                          onValueChange={(value) => handleStatusChange(po.opportunityId, value)}
                        >
                          <SelectTrigger className="w-48 border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="SUBMITTED">Submitted</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOpportunity(po.opportunityId, po.opportunity.siteName)}
                      disabled={removeOpportunity.isPending}
                      className="border-2 border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
