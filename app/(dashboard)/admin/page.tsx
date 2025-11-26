'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Database,
  Users,
  FolderOpen,
  ListChecks,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function AdminPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'NEEDS_REVIEW' | 'BROKEN' | undefined>();

  // Debug logging
  console.log('[Admin Page] Session:', JSON.stringify(session));
  console.log('[Admin Page] User role:', (session?.user as any)?.role);

  // Redirect if not admin
  if ((session?.user as any)?.role !== 'ADMIN') {
    console.log('[Admin Page] Not admin, redirecting');
    router.push('/dashboard');
    return null;
  }

  const { data: stats } = trpc.admin.getStats.useQuery();
  const { data: opportunitiesData, isLoading, refetch } = trpc.admin.listOpportunities.useQuery({
    search: search || undefined,
    status: statusFilter,
    limit: 50,
  });

  const deleteOpportunity = trpc.admin.deleteOpportunity.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      await deleteOpportunity.mutateAsync({ id });
    }
  };

  const statCards = [
    {
      title: 'Total Opportunities',
      value: stats?.totalOpportunities || 0,
      icon: Database,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Active Opportunities',
      value: stats?.activeOpportunities || 0,
      icon: TrendingUp,
      gradient: 'from-green-500 to-teal-500',
    },
    {
      title: 'Total Instructions',
      value: stats?.totalInstructions || 0,
      icon: ListChecks,
      gradient: 'from-navy-500 to-sky-500',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-14 w-14 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-gray-600 text-sm font-medium">Manage backlink opportunities and tutorials</p>
            </div>
          </div>
        </div>
        <Link href="/admin/opportunities/new">
          <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg h-12 px-6 font-semibold">
            <Plus className="h-5 w-5 mr-2" />
            Add New Opportunity
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="font-semibold text-gray-700">{stat.title}</CardDescription>
                  <div className={`h-10 w-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filter */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-6 w-6 text-navy-500" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by site name, description, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 border-2 focus:border-purple-400"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === undefined ? 'default' : 'outline'}
                onClick={() => setStatusFilter(undefined)}
                className={statusFilter === undefined ? 'bg-gradient-to-r from-navy-500 to-sky-500' : ''}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ACTIVE')}
                className={statusFilter === 'ACTIVE' ? 'bg-gradient-to-r from-green-500 to-teal-500' : ''}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('INACTIVE')}
                className={statusFilter === 'INACTIVE' ? 'bg-gradient-to-r from-gray-500 to-gray-600' : ''}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Database className="h-6 w-6 text-blue-600" />
            Backlink Opportunities
          </CardTitle>
          <CardDescription>
            Manage all backlink opportunities and their step-by-step tutorials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="h-16 w-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <Sparkles className="h-6 w-6 text-navy-500 absolute top-5 left-5 animate-pulse" />
              </div>
            </div>
          ) : !opportunitiesData?.opportunities.length ? (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold text-lg">No opportunities found</p>
              <p className="text-gray-500 text-sm">Create your first opportunity to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunitiesData.opportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="border-2 rounded-2xl p-6 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{opportunity.siteName}</h3>
                          <p className="text-gray-600 text-sm mb-3">{opportunity.shortDescription}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={`${
                              opportunity.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-300' :
                              opportunity.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                              opportunity.status === 'NEEDS_REVIEW' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                              'bg-red-100 text-red-700 border-red-300'
                            } border-2 font-semibold`}>
                              {opportunity.status}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 border-2 border-purple-300 font-semibold">
                              {opportunity.category}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 border-2 border-blue-300 font-semibold">
                              {opportunity.linkType}
                            </Badge>
                            <Badge className="bg-orange-100 text-orange-700 border-2 border-orange-300 font-semibold">
                              <ListChecks className="h-3 w-3 mr-1" />
                              {opportunity._count.instructions} steps
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        {opportunity.domainAuthority && (
                          <span className="font-semibold">DA: {opportunity.domainAuthority}</span>
                        )}
                        {opportunity.domainRating && (
                          <span className="font-semibold">DR: {opportunity.domainRating}</span>
                        )}
                        <span className="font-semibold">Difficulty: {opportunity.difficultyLevel}/5</span>
                        <span className="font-semibold">{opportunity.isFree ? 'Free' : `$${opportunity.cost}`}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/opportunities/${opportunity.id}/edit`}>
                        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(opportunity.id, opportunity.siteName)}
                        className="border-2 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-400"
                        disabled={deleteOpportunity.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
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
