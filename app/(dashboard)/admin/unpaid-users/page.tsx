'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Users, 
  Clock, 
  CheckCircle2, 
  Send,
  Filter,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UnpaidUsersPage() {
  const [dateRange, setDateRange] = useState<'1_month' | '3_months' | '6_months' | '1_year' | 'all'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch unpaid users
  const { data, isLoading, refetch } = trpc.admin.getUnpaidUsers.useQuery({ 
    dateRange,
    limit: 100 
  });

  // Fetch statistics
  const { data: stats } = trpc.admin.getUnpaidUsersStats.useQuery();

  // Send email mutation
  const sendEmailMutation = trpc.admin.sendUnpaidUserEmail.useMutation({
    onSuccess: (result) => {
      toast.success(`📧 Emails sent!`, {
        description: `${result.sent} sent successfully, ${result.failed} failed`,
      });
      setSelectedUsers(new Set());
      setCustomMessage('');
      setIsSending(false);
    },
    onError: (error) => {
      toast.error('Failed to send emails', {
        description: error.message,
      });
      setIsSending(false);
    },
  });

  const handleSelectAll = () => {
    if (data && selectedUsers.size === data.users.length) {
      setSelectedUsers(new Set());
    } else if (data) {
      setSelectedUsers(new Set(data.users.map(u => u.id)));
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSendEmails = async () => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }

    const confirmed = confirm(
      `Send email to ${selectedUsers.size} user(s)?${customMessage ? '\n\nWith custom message: ' + customMessage : ''}`
    );

    if (!confirmed) return;

    setIsSending(true);
    sendEmailMutation.mutate({
      userIds: Array.from(selectedUsers),
      customMessage: customMessage || undefined,
    });
  };

  const dateRangeOptions = [
    { value: 'all', label: 'All Time', icon: Calendar },
    { value: '1_month', label: 'Last Month', icon: Clock },
    { value: '3_months', label: 'Last 3 Months', icon: Clock },
    { value: '6_months', label: 'Last 6 Months', icon: Clock },
    { value: '1_year', label: 'Last Year', icon: Calendar },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Unpaid Users
            </h1>
            <p className="text-gray-600 mt-2">
              Registered users who haven't upgraded to a paid plan
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-2 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Unpaid</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last Month</p>
                    <p className="text-3xl font-bold text-green-600">{stats.lastMonth}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last 3 Months</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.last3Months}</p>
                  </div>
                  <Clock className="h-10 w-10 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last 6 Months</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.last6Months}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last Year</p>
                    <p className="text-3xl font-bold text-gray-600">{stats.lastYear}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-gray-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Send Emails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Filter by Registration Date
              </label>
              <div className="flex gap-2 flex-wrap">
                {dateRangeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={dateRange === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRange(option.value)}
                    className={dateRange === option.value ? 'bg-blue-600' : ''}
                  >
                    <option.icon className="h-4 w-4 mr-2" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Custom Message (Optional)
              </label>
              <Textarea
                placeholder="Add a personal message to the email (e.g., 'Limited time 20% off for returning users!')"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will appear at the top of the email in a highlighted box
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                disabled={!data || data.users.length === 0}
              >
                {selectedUsers.size === data?.users.length ? 'Deselect All' : 'Select All'}
              </Button>

              <Button
                onClick={handleSendEmails}
                disabled={selectedUsers.size === 0 || isSending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : `Send Email to ${selectedUsers.size} User(s)`}
              </Button>

              {selectedUsers.size > 0 && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  {selectedUsers.size} selected
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {data ? `${data.users.length} User(s) Found` : 'Loading...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading users...</p>
              </div>
            ) : data && data.users.length > 0 ? (
              <div className="space-y-2">
                {data.users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUsers.has(user.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`flex items-center justify-center w-6 h-6 rounded border-2 ${
                        selectedUsers.has(user.id) 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300'
                      }`}>
                        {selectedUsers.has(user.id) && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{user.name || 'No Name'}</p>
                          <Badge variant="outline">{user.subscription?.plan.name || 'Free'}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="text-gray-500">Registered</p>
                          <p className="font-semibold text-gray-700">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-gray-500">Days Ago</p>
                          <p className="font-semibold text-orange-600">
                            {user.daysSinceRegistration} days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No unpaid users found for this date range</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
