'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/api/client';
import { toast } from 'sonner';
import { 
  Plus, 
  FolderOpen, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  XCircle,
  Circle,
  Sparkles,
  ExternalLink,
  Globe,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Sample demo projects for visual appeal
const DEMO_PROJECTS = [
  {
    id: 'demo-1',
    name: 'TechStartup Website',
    domain: 'techstartup.io',
    niche: 'Technology',
    color: '#3b82f6',
    description: 'Building backlinks for our SaaS platform',
    opportunities: 15,
    stats: { notStarted: 5, inProgress: 6, completed: 4 },
    isDemo: true
  },
  {
    id: 'demo-2',
    name: 'E-Commerce Store',
    domain: 'mystore.com',
    niche: 'E-commerce',
    color: '#8b5cf6',
    description: 'SEO campaign for online retail',
    opportunities: 22,
    stats: { notStarted: 8, inProgress: 10, completed: 4 },
    isDemo: true
  },
  {
    id: 'demo-3',
    name: 'Health Blog',
    domain: 'healthblog.net',
    niche: 'Health & Wellness',
    color: '#10b981',
    description: 'Organic traffic growth strategy',
    opportunities: 12,
    stats: { notStarted: 2, inProgress: 5, completed: 5 },
    isDemo: true
  },
];

export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
  });

  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.project.list.useQuery({});
  
  const createMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      toast.success('🎉 Project created successfully!');
      setIsDialogOpen(false);
      setFormData({ name: '', domain: '', description: '' });
      utils.project.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success('✅ Project updated successfully!');
      setIsDialogOpen(false);
      setEditingProject(null);
      setFormData({ name: '', domain: '', description: '' });
      utils.project.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast.success('🗑️ Project deleted successfully!');
      utils.project.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      domain: project.domain || '',
      niche: project.niche || '',
      description: project.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (project: any) => {
    if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone and will remove all associated opportunities.`)) {
      deleteMutation.mutate({ id: project.id });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingProject(null);
      setFormData({ name: '', domain: '', description: '' });
    }
  };

  // Combine real projects with demo projects
  const allProjects = [
    ...(projects?.projects || []).map(p => ({
      ...p,
      opportunities: p._count.opportunities,
      stats: p.opportunities.reduce((acc, opp) => {
        if (opp.status === 'NOT_STARTED') acc.notStarted++;
        else if (opp.status === 'IN_PROGRESS') acc.inProgress++;
        else if (opp.status === 'APPROVED') acc.completed++;
        return acc;
      }, { notStarted: 0, inProgress: 0, completed: 0 }),
      isDemo: false
    })),
    ...DEMO_PROJECTS
  ];

  const getProgressPercentage = (stats: any) => {
    const total = stats.notStarted + stats.inProgress + stats.completed;
    return total > 0 ? (stats.completed / total) * 100 : 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-navy-500 to-sky-500 bg-clip-text text-transparent">
            Your Projects
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Manage your backlink building campaigns
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Website"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="domain" className="text-sm font-medium">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief project description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? (editingProject ? 'Updating...' : 'Creating...') 
                  : (editingProject ? 'Update Project' : 'Create Project')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Projects</p>
                <p className="text-3xl font-bold text-blue-900">{allProjects.length}</p>
              </div>
              <FolderOpen className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-paleblue-50 to-purple-100 border-navy-200 shadow-md hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-600">In Progress</p>
                <p className="text-3xl font-bold text-purple-900">
                  {allProjects.reduce((sum, p) => sum + (p.stats?.inProgress || 0), 0)}
                </p>
              </div>
              <Clock className="h-10 w-10 text-navy-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-3xl font-bold text-green-900">
                  {allProjects.reduce((sum, p) => sum + (p.stats?.completed || 0), 0)}
                </p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      ) : allProjects.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-50 to-white border-dashed border-2 border-gray-300">
          <CardContent className="text-center py-16">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to start building backlinks</p>
            <Button onClick={() => setIsDialogOpen(true)} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => {
            const progress = getProgressPercentage(project.stats);
            const gradients = [
              'from-blue-500 to-cyan-500',
              'from-navy-500 to-sky-500',
              'from-green-500 to-emerald-500',
              'from-gold-500 to-red-500',
              'from-indigo-500 to-purple-500',
            ];
            const gradient = gradients[Math.floor(Math.random() * gradients.length)];

            return (
              <Card 
                key={project.id} 
                className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 hover:-translate-y-1 bg-white overflow-hidden"
              >
                {/* Color Header */}
                <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                
                <CardContent className="pt-6 space-y-4">
                  {/* Project Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                        style={{ backgroundColor: project.color || '#3b82f6' }}
                      >
                        <FolderOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate">
                          {project.name}
                        </h3>
                        {project.domain && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Globe className="h-3 w-3" />
                            <span className="truncate">{project.domain}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {project.isDemo && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        Demo
                      </Badge>
                    )}
                  </div>

                  {/* Niche Badge */}
                  {project.niche && (
                    <Badge className={`bg-gradient-to-r ${gradient} text-white border-0`}>
                      {project.niche}
                    </Badge>
                  )}

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">Progress</span>
                      <span className="text-gray-900 font-bold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Circle className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500">To Do</p>
                      <p className="text-sm font-bold text-gray-900">{project.stats?.notStarted || 0}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-3 w-3 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600">Active</p>
                      <p className="text-sm font-bold text-blue-900">{project.stats?.inProgress || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600">Done</p>
                      <p className="text-sm font-bold text-green-900">{project.stats?.completed || 0}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/projects/${project.id}`} className="flex-1">
                      <Button 
                        variant="default" 
                        className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 shadow-md`}
                        size="sm"
                      >
                        View Details
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    {!project.isDemo && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(project)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(project)} 
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
