'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  UserPlus,
  UserMinus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TimeRange = 'today' | 'week' | 'month' | 'year';

export default function AdminStatisticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Fetch statistics data with aggressive refresh settings
  const { data: usersData, refetch, isLoading, isFetching } = trpc.admin.listUsers.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
    refetchOnWindowFocus: true, // Refresh when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0, // Consider data stale immediately
    cacheTime: 0, // Don't cache the data
  });
  const users = usersData?.users || [];

  // Fetch payment transactions for Recent Orders
  const { data: transactionsData } = trpc.admin.getRecentTransactions.useQuery(undefined, {
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0,
  });
  const transactions = transactionsData?.transactions || [];

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Statistics Updated',
        description: 'The latest data has been loaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh statistics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.subscription?.status === 'ACTIVE').length;
  const pendingUsers = users.filter(u => u.accountStatus === 'PENDING').length;

  // Filter users by time range
  const filterByTimeRange = (date: string) => {
    const userDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    switch (timeRange) {
      case 'today':
        return userDate >= today;
      case 'week':
        return userDate >= weekAgo;
      case 'month':
        return userDate >= monthAgo;
      case 'year':
        return userDate >= yearAgo;
      default:
        return true;
    }
  };

  // Get users by category
  const newSignups = users
    .filter(u => filterByTimeRange(u.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const cancelledUsers = users
    .filter(u => u.subscription?.status === 'CANCELED' && filterByTimeRange(u.subscription.updatedAt || u.updatedAt))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Recent Orders - use payment transactions instead of user creation dates
  const recentOrders = transactions
    .filter(t => filterByTimeRange(t.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Show ALL members, sorted by creation date
  const recentMembers = users
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate stats for the selected time period (for cards)
  const currentStats = {
    sales: recentOrders.length,
    revenue: recentOrders.reduce((sum, t) => sum + t.amount, 0),
  };

  const currentMembership = {
    signups: newSignups.length,
    cancellations: cancelledUsers.length,
  };

  // Calculate TOTAL stats (all time - for display purposes)
  const totalStats = {
    allUsers: users.length,
    allTransactions: transactions.length,
    totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
    allActiveUsers: users.filter(u => u.subscription?.status === 'ACTIVE').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Statistics Dashboard
            {isFetching && !isRefreshing && (
              <span className="inline-flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span className="text-xs">Updating...</span>
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Overview of sales, revenue, and membership • Auto-refreshes every 5s
            {users.length > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                • {users.length} registered user{users.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sales & Revenue Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Sales & Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{totalStats.allTransactions}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    all time orders
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <span className="text-blue-600 font-medium">{currentStats.sales}</span>
                <span className="text-muted-foreground ml-2">
                  {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    ${totalStats.totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    all time • {totalStats.allTransactions} orders
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <span className="text-blue-600 font-medium">
                  ${currentStats.revenue.toFixed(2)}
                </span>
                <span className="text-muted-foreground ml-2">
                  {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    ${(currentStats.revenue / currentStats.sales).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">per transaction</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">+5.1%</span>
                <span className="text-muted-foreground ml-2">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">registered users</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <span className="text-blue-600 font-medium">{activeUsers} active</span>
                <span className="text-muted-foreground ml-2">• {pendingUsers} pending</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Membership Stats Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Membership Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{currentMembership.signups}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">+23.4%</span>
                <span className="text-muted-foreground ml-2">growth rate</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cancellations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{currentMembership.cancellations}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <UserMinus className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <ArrowDownRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">-8.3%</span>
                <span className="text-muted-foreground ml-2">decrease from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              New Signups
            </CardTitle>
            <CardDescription>Users who recently joined ({newSignups.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            {newSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No new signups in this period</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {newSignups.slice(0, 15).map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{user.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <Badge variant={user.accountStatus === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                        {user.accountStatus}
                      </Badge>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancellations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-600" />
              Cancellations
            </CardTitle>
            <CardDescription>Users who cancelled subscriptions ({cancelledUsers.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            {cancelledUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No cancellations in this period</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {cancelledUsers.slice(0, 15).map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white font-bold shrink-0">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{user.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <Badge variant="destructive" className="text-xs">
                        CANCELED
                      </Badge>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(user.subscription?.canceledAt || user.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest paid subscription purchases ({recentOrders.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No orders in this period</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentOrders.slice(0, 15).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                        {transaction.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{transaction.user?.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{transaction.user?.email}</p>
                        <p className="text-xs text-blue-600 font-medium truncate">
                          {transaction.user?.subscription?.plan?.name || 'Unknown Plan'}
                        </p>
                        {transaction.metadata && (transaction.metadata as any).source === 'admin_update' && (
                          <p className="text-xs text-orange-600 font-medium">
                            Updated by admin
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-green-600 whitespace-nowrap">
                        ${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Recent Members
            </CardTitle>
            <CardDescription>Most recent active members ({recentMembers.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No members to display</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentMembers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{user.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.subscription?.plan && (
                          <p className="text-xs text-purple-600 font-medium truncate">
                            {user.subscription.plan.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <Badge variant={user.accountStatus === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                        {user.accountStatus}
                      </Badge>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
