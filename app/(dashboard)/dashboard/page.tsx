'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/api/client';
import { FolderOpen, Database, TrendingUp, Plus, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: projects, isLoading: projectsLoading } = trpc.project.list.useQuery({ limit: 5 });
  const { data: usageStats } = trpc.subscription.getUsageStats.useQuery();
  const { data: subscription } = trpc.subscription.getCurrent.useQuery();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {session?.user?.name}!</h1>
        <p className="text-gray-600">Here's your backlink building progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.projects.used || 0} / {usageStats?.projects.limit || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {(usageStats?.projects.limit || 0) - (usageStats?.projects.used || 0)} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities Added</CardTitle>
            <Database className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.opportunities.used || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscription?.plan?.name || 'Free'}</div>
            <p className="text-xs text-gray-600 mt-1">
              {subscription?.status === 'ACTIVE' ? 'Active' : subscription?.status}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/projects">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
          <Link href="/opportunities">
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Browse Opportunities
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Projects</CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="text-center py-8 text-gray-600">Loading projects...</div>
          ) : !projects?.projects || projects.projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No projects yet</p>
              <Link href="/projects">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.projects.map((project) => {
                const totalOpps = project._count.opportunities;
                const statusCounts = project.opportunities.reduce((acc, opp) => {
                  acc[opp.status] = (acc[opp.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {project.color && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                          )}
                          <h3 className="font-semibold">{project.name}</h3>
                        </div>
                        <Badge variant="secondary">{totalOpps} opportunities</Badge>
                      </div>
                      {project.domain && (
                        <p className="text-sm text-gray-600 mb-2">{project.domain}</p>
                      )}
                      <div className="flex gap-2 text-xs">
                        {statusCounts.NOT_STARTED && (
                          <span className="text-gray-600">
                            {statusCounts.NOT_STARTED} not started
                          </span>
                        )}
                        {statusCounts.IN_PROGRESS && (
                          <span className="text-blue-600">
                            {statusCounts.IN_PROGRESS} in progress
                          </span>
                        )}
                        {statusCounts.APPROVED && (
                          <span className="text-green-600">
                            {statusCounts.APPROVED} approved
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
