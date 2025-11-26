'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/api/client';
import { 
  FolderOpen, 
  Database, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: projects, isLoading: projectsLoading } = trpc.project.list.useQuery({ limit: 5 });
  const { data: usageStats } = trpc.subscription.getUsageStats.useQuery();
  const { data: subscription } = trpc.subscription.getCurrent.useQuery();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <span className="text-sm font-medium text-white/80">{getGreeting()}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              Your backlink building progress is looking great. Keep up the momentum! 🚀
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-24 w-24 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center">
              <Target className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Your Projects</CardTitle>
            <FolderOpen className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">
              {usageStats?.projects.used || 0}
            </div>
            <p className="text-sm text-white/80">
              of {usageStats?.projects.limit || 0} available
            </p>
            <Progress 
              value={((usageStats?.projects.used || 0) / (usageStats?.projects.limit || 1)) * 100} 
              className="h-2 mt-3 bg-white/20"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-navy-500 to-sky-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Opportunities Added</CardTitle>
            <Database className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">
              {usageStats?.opportunities.used || 0}
            </div>
            <p className="text-sm text-white/80">
              Across all projects
            </p>
            <div className="mt-3 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Actively tracking</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Current Plan</CardTitle>
            <Zap className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">{subscription?.plan?.name || 'Free'}</div>
            <p className="text-sm text-white/80">
              {subscription?.status === 'ACTIVE' ? 'Active subscription' : subscription?.status}
            </p>
            <div className="mt-3">
              <Badge className="bg-white/20 backdrop-blur border-white/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium Features
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/projects">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </Link>
          <Link href="/opportunities">
            <Button size="lg" variant="outline" className="border-2 hover:border-blue-600 hover:bg-blue-50">
              <Database className="h-5 w-5 mr-2" />
              Browse Opportunities
            </Button>
          </Link>
          <Link href="/analytics">
            <Button size="lg" variant="outline" className="border-2 hover:border-purple-600 hover:bg-purple-50">
              <TrendingUp className="h-5 w-5 mr-2" />
              View Analytics
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            Recent Projects
          </CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-blue-50">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          ) : !projects?.projects || projects.projects.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 text-lg font-medium">No projects yet</p>
              <Link href="/projects">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.projects.map((project) => {
                const totalOpps = project._count.opportunities;
                const statusCounts = project.opportunities.reduce((acc, opp) => {
                  acc[opp.status] = (acc[opp.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                const progress = totalOpps > 0 ? ((statusCounts.APPROVED || 0) / totalOpps) * 100 : 0;

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="p-5 border-2 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50 group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {project.color && (
                            <div
                              className="h-12 w-12 rounded-xl flex items-center justify-center shadow-md"
                              style={{ backgroundColor: project.color }}
                            >
                              <FolderOpen className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">
                              {project.name}
                            </h3>
                            {project.domain && (
                              <p className="text-sm text-gray-500">{project.domain}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-2">
                            {totalOpps} opportunities
                          </Badge>
                          <div className="text-sm font-bold text-blue-600">
                            {Math.round(progress)}% Complete
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={progress} className="h-2 mb-3" />
                      
                      <div className="flex gap-4 text-sm">
                        {statusCounts.NOT_STARTED && (
                          <span className="text-gray-600">
                            ⚪ {statusCounts.NOT_STARTED} not started
                          </span>
                        )}
                        {statusCounts.IN_PROGRESS && (
                          <span className="text-blue-600">
                            🔵 {statusCounts.IN_PROGRESS} in progress
                          </span>
                        )}
                        {statusCounts.APPROVED && (
                          <span className="text-green-600">
                            ✅ {statusCounts.APPROVED} approved
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
