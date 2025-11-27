'use client';

import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Crown, Mail, Calendar, FolderOpen, Loader2, Search, X, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';

export default function AdminUsersPage() {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const { data: plans } = trpc.subscription.listPlans.useQuery();
  const updatePlan = trpc.admin.updateUserPlan.useMutation({
    onSuccess: () => {
      toast.success('User plan updated successfully!');
      refetch();
      setUpdatingUser(null);
    },
    onError: (error) => {
      toast.error(`Failed to update plan: ${error.message}`);
      setUpdatingUser(null);
    },
  });

  const cancelSubscription = trpc.admin.cancelUserSubscription.useMutation({
    onSuccess: () => {
      toast.success('Membership canceled successfully!');
      refetch();
      setUpdatingUser(null);
    },
    onError: (error) => {
      toast.error(`Failed to cancel membership: ${error.message}`);
      setUpdatingUser(null);
    },
  });

  const handlePlanChange = async (userId: string, planId: string) => {
    setUpdatingUser(userId);
    await updatePlan.mutateAsync({ userId, planId });
  };

  const handleCancelMembership = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to cancel the membership for ${userName}? This action cannot be undone.`)) {
      setUpdatingUser(userId);
      await cancelSubscription.mutateAsync({ userId });
    }
  };

  // Filter users based on search query (case-insensitive, search by name and email)
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      user.email.toLowerCase().includes(query) ||
      (user.name?.toLowerCase() || '').includes(query)
    );
  }, [users, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-navy-500 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-navy-500 to-sky-500 bg-clip-text text-transparent mb-2">
          User Management
        </h1>
        <p className="text-gray-600 text-lg">Manage user accounts and subscription plans</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <h3 className="text-3xl font-bold mt-2">{users?.length || 0}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-navy-100 to-sky-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-navy-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Plans</p>
                <h3 className="text-3xl font-bold mt-2">
                  {users?.filter(u => u.subscription?.status === 'ACTIVE').length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <Crown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Projects</p>
                <h3 className="text-3xl font-bold mt-2">
                  {users?.reduce((sum, u) => sum + u._count.projects, 0) || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Admin Users</p>
                <h3 className="text-3xl font-bold mt-2">
                  {users?.filter(u => u.role === 'ADMIN').length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                <Crown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({filteredUsers?.length || 0})
            </CardTitle>
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by user/email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 border-2"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Card key={user.id} className="border-2 hover:border-navy-400 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* User Avatar */}
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-navy-500 to-sky-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{user.name || 'No Name'}</h3>
                          {user.role === 'ADMIN' && (
                            <Badge className="bg-red-500 text-white">Admin</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            <span>{user._count.projects} projects</span>
                          </div>
                        </div>
                      </div>

                      {/* Current Plan */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-600 mb-2">Current Plan</p>
                        {user.subscription ? (
                          <Badge className="bg-gradient-to-r from-navy-500 to-sky-500 text-white">
                            {user.subscription.plan.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Plan</Badge>
                        )}
                      </div>

                      {/* Plan Selector */}
                      <div className="flex-shrink-0 w-64">
                        <Select
                          value={user.subscription?.planId || ''}
                          onValueChange={(planId) => handlePlanChange(user.id, planId)}
                          disabled={updatingUser === user.id}
                        >
                          <SelectTrigger className="border-2">
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans?.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                <div className="flex items-center justify-between gap-4">
                                  <span>{plan.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ${(plan.price / 100).toFixed(2)}/{plan.interval}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {updatingUser === user.id && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-navy-600">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Updating...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-600 py-8">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
