'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ArrowDownRight
} from 'lucide-react';

type TimeRange = 'today' | 'week' | 'month' | 'year';

export default function AdminStatisticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Fetch statistics data
  const { data: usersData } = trpc.admin.listUsers.useQuery();
  const users = usersData?.users || [];

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.subscription?.status === 'ACTIVE').length;
  const pendingUsers = users.filter(u => u.accountStatus === 'PENDING').length;
  const recentUsers = users.slice(0, 5);

  // Mock data for sales/revenue (you can replace with actual payment data)
  const stats = {
    today: { sales: 12, revenue: 2450 },
    week: { sales: 48, revenue: 9800 },
    month: { sales: 187, revenue: 38500 },
    year: { sales: 2048, revenue: 425000 },
  };

  const membershipStats = {
    today: { signups: 5, cancellations: 1 },
    week: { signups: 23, cancellations: 4 },
    month: { signups: 89, cancellations: 12 },
    year: { signups: 856, cancellations: 143 },
  };

  const currentStats = stats[timeRange];
  const currentMembership = membershipStats[timeRange];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistics Dashboard</h1>
          <p className="text-muted-foreground">Overview of sales, revenue, and membership</p>
        </div>
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
                  <div className="text-3xl font-bold">{currentStats.sales}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">+12.5%</span>
                <span className="text-muted-foreground ml-2">vs previous period</span>
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
                    ${currentStats.revenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">+18.2%</span>
                <span className="text-muted-foreground ml-2">vs previous period</span>
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

      {/* Recent Orders & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest subscription purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.slice(0, 5).map((user, index) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ${user.subscription?.plan?.price 
                        ? (user.subscription.plan.price / 100).toFixed(2) 
                        : '0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>Newest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={user.accountStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                      {user.accountStatus}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
