'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, FolderOpen } from 'lucide-react';

export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    niche: '',
    description: '',
  });

  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.project.list.useQuery({});
  const createMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      toast.success('Project created!');
      setIsDialogOpen(false);
      setFormData({ name: '', domain: '', niche: '', description: '' });
      utils.project.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your backlink building projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="My Website SEO"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="niche">Niche</Label>
                <Input
                  id="niche"
                  placeholder="Technology, Health, etc."
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : !projects?.projects || projects.projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No projects yet</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.projects.map((project) => {
            const totalOpps = project._count.opportunities;
            const statusCounts = project.opportunities.reduce((acc, opp) => {
              acc[opp.status] = (acc[opp.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        {project.color && (
                          <div
                            className="h-4 w-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                        )}
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                      </div>

                      {project.domain && (
                        <p className="text-sm text-gray-600">{project.domain}</p>
                      )}

                      {project.niche && (
                        <Badge variant="secondary">{project.niche}</Badge>
                      )}

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Opportunities</span>
                          <Badge variant="outline">{totalOpps}</Badge>
                        </div>

                        {totalOpps > 0 && (
                          <div className="mt-2 space-y-1 text-xs">
                            {statusCounts.NOT_STARTED && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Not Started</span>
                                <span>{statusCounts.NOT_STARTED}</span>
                              </div>
                            )}
                            {statusCounts.IN_PROGRESS && (
                              <div className="flex justify-between">
                                <span className="text-blue-600">In Progress</span>
                                <span>{statusCounts.IN_PROGRESS}</span>
                              </div>
                            )}
                            {statusCounts.APPROVED && (
                              <div className="flex justify-between">
                                <span className="text-green-600">Approved</span>
                                <span>{statusCounts.APPROVED}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
