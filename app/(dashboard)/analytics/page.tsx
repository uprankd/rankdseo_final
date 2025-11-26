'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from '@/components/charts/ChartComponents';
import { 
  TrendingUp, TrendingDown, Award, Target, Link2, CheckCircle2, 
  XCircle, Clock, Download, Activity, BarChart3, PieChart as PieChartIcon,
  ArrowUpRight, Calendar, Zap, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#060B70', '#05B3F2', '#0490C2', '#D3EBF5', '#05095C', '#E5F7FE', '#040748', '#CCEFFD'];

const StatCard = (props) => {
  const { title, value, change, icon: Icon, trend } = props;
  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4" />}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-navy-50 to-sky-50 flex items-center justify-center">
            <Icon className="h-7 w-7 text-navy-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AnalyticsPage() {
  const [exportingData, setExportingData] = useState(false);

  // Queries with caching and stale time
  const { data: overviewStats, isLoading: loadingOverview, refetch: refetchOverview } = trpc.analytics.getOverviewStats.useQuery(undefined, {
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
  const { data: timelineData, refetch: refetchTimeline } = trpc.analytics.getTimelineData.useQuery({ months: 6 }, {
    staleTime: 30 * 1000,
    enabled: !!overviewStats, // Only load after overview loads
  });
  const { data: linkTypeDistribution, refetch: refetchLinkType } = trpc.analytics.getLinkTypeDistribution.useQuery(undefined, {
    staleTime: 30 * 1000,
    enabled: !!overviewStats,
  });
  const { data: nicheDistribution, refetch: refetchNiche } = trpc.analytics.getNicheDistribution.useQuery(undefined, {
    staleTime: 30 * 1000,
    enabled: !!overviewStats,
  });
  const { data: topOpportunities, refetch: refetchTop } = trpc.analytics.getTopOpportunities.useQuery(undefined, {
    staleTime: 30 * 1000,
    enabled: !!overviewStats,
  });
  const { data: recentActivity, refetch: refetchRecent } = trpc.analytics.getRecentActivity.useQuery({ limit: 10 }, {
    staleTime: 30 * 1000,
    enabled: !!overviewStats,
  });
  const { data: projectPerformance, refetch: refetchProject } = trpc.analytics.getProjectPerformance.useQuery(undefined, {
    staleTime: 30 * 1000,
    enabled: !!overviewStats,
  });

  const exportData = trpc.analytics.exportAnalytics.useQuery(undefined, {
    enabled: false,
  });

  const handleRefreshData = async () => {
    toast.info('Refreshing analytics data...');
    await Promise.all([
      refetchOverview(),
      refetchTimeline(),
      refetchLinkType(),
      refetchNiche(),
      refetchTop(),
      refetchRecent(),
      refetchProject(),
    ]);
    toast.success('Analytics data refreshed!');
  };

  const handleExport = async () => {
    setExportingData(true);
    const { refetch } = exportData;
    const { data } = await refetch();
    
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      toast.success('Analytics data exported successfully');
    }
    setExportingData(false);
  };

  if (loadingOverview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-navy-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-navy-500 to-sky-500 bg-clip-text text-transparent mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Comprehensive insights into your backlink building performance</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleRefreshData}
            variant="outline"
            className="border-navy-200 text-navy-500 hover:bg-navy-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={exportingData}
            className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-sky-600"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Backlinks"
          value={overviewStats?.totalOpportunities || 0}
          icon={Link2}
        />
        <StatCard
          title="Approved Links"
          value={overviewStats?.approvedLinks || 0}
          icon={CheckCircle2}
        />
        <StatCard
          title="Success Rate"
          value={`${overviewStats?.successRate || 0}%`}
          icon={Target}
          trend={overviewStats && overviewStats.successRate > 70 ? 'up' : 'down'}
        />
        <StatCard
          title="Avg Domain Authority"
          value={overviewStats?.avgDA || 0}
          icon={Award}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-navy-500" />
              Backlink Acquisition Timeline
            </CardTitle>
            <CardDescription>Last 6 months performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} name="Approved" />
                <Line type="monotone" dataKey="submitted" stroke="#f59e0b" strokeWidth={2} name="Submitted" />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Link Type Distribution */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-navy-500" />
              Link Type Distribution
            </CardTitle>
            <CardDescription>Breakdown by link type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={linkTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {linkTypeDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* More Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Project Performance */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-navy-500" />
              Project Performance
            </CardTitle>
            <CardDescription>Completion rate by project</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#10b981" name="Approved" />
                <Bar dataKey="total" fill="#e5e7eb" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Niche Distribution */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-navy-500" />
              Top Niches
            </CardTitle>
            <CardDescription>Most active niches</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nicheDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Link Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Domain Authority</span>
              <span className="font-bold text-lg">{overviewStats?.avgDA || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Domain Rating</span>
              <span className="font-bold text-lg">{overviewStats?.avgDR || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dofollow Links</span>
              <span className="font-bold text-lg text-green-600">{overviewStats?.dofollowCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nofollow Links</span>
              <span className="font-bold text-lg text-gray-500">{overviewStats?.nofollowCount || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved</span>
              <Badge className="bg-green-100 text-green-700">{overviewStats?.approvedLinks || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Submitted</span>
              <Badge className="bg-yellow-100 text-yellow-700">{overviewStats?.submittedLinks || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <Badge className="bg-blue-100 text-blue-700">{overviewStats?.inProgressLinks || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rejected</span>
              <Badge className="bg-red-100 text-red-700">{overviewStats?.rejectedLinks || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-navy-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-navy-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <p className="text-sm">
                {overviewStats && overviewStats.successRate > 70 
                  ? 'Excellent success rate! Keep up the great work.' 
                  : 'Focus on improving submission quality for better approval rates.'}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowUpRight className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
              <p className="text-sm">
                Average DA of {overviewStats?.avgDA} shows {overviewStats && overviewStats.avgDA > 70 ? 'high' : 'moderate'} quality backlinks.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowUpRight className="h-4 w-4 text-navy-500 mt-1 flex-shrink-0" />
              <p className="text-sm">
                {overviewStats && overviewStats.dofollowCount > overviewStats.nofollowCount 
                  ? 'Great dofollow ratio for SEO impact!' 
                  : 'Consider targeting more dofollow opportunities.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Opportunities */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-navy-500" />
            Top Performing Opportunities
          </CardTitle>
          <CardDescription>Sites with highest success rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topOpportunities && topOpportunities.length > 0 ? (
              topOpportunities.map((opp, index) => (
                <div key={opp.id} className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-navy-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-navy-500 to-sky-500 flex items-center justify-center text-white font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{opp.siteName}</h4>
                      <p className="text-sm text-gray-600">{opp.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Domain Authority</p>
                      <p className="font-bold text-lg">{opp.domainAuthority || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Approved Links</p>
                      <p className="font-bold text-lg text-green-600">{opp.count}</p>
                    </div>
                    <Badge className={opp.isDofollow ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {opp.isDofollow ? 'Dofollow' : 'Nofollow'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 py-8">No approved opportunities yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-navy-500" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates on your backlinks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'APPROVED' ? 'bg-green-500' :
                      activity.status === 'SUBMITTED' ? 'bg-yellow-500' :
                      activity.status === 'REJECTED' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium">{activity.opportunity.siteName}</p>
                      <p className="text-sm text-gray-600">{activity.project.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{activity.status.replace('_', ' ')}</Badge>
                    <span className="text-sm text-gray-600">{format(new Date(activity.updatedAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
