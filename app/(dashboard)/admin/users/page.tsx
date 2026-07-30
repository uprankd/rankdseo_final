'use client';

import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Crown, Mail, Calendar, FolderOpen, Loader2, Search, X, XCircle, RotateCcw, KeyRound, Copy, Eye, EyeOff, Edit, Trash2, Send, CheckSquare, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';

export default function AdminUsersPage() {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; userId: string; userName: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [editUserDialog, setEditUserDialog] = useState<{ open: boolean; userId: string; currentName: string; currentEmail: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sendingResetEmail, setSendingResetEmail] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  
  const { data: usersData, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const users = usersData?.users || [];
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

  const restoreSubscription = trpc.admin.restoreUserSubscription.useMutation({
    onSuccess: () => {
      toast.success('Membership restored successfully!');
      refetch();
      setUpdatingUser(null);
    },
    onError: (error) => {
      toast.error(`Failed to restore membership: ${error.message}`);
      setUpdatingUser(null);
    },
  });

  const resetPassword = trpc.admin.resetUserPassword.useMutation({
    onSuccess: () => {
      toast.success('Password reset successfully!');
      setResetPasswordDialog(null);
      setNewPassword('');
      setGeneratedPassword('');
      setShowPassword(false);
    },
    onError: (error) => {
      toast.error(`Failed to reset password: ${error.message}`);
    },
  });

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success('User updated successfully!');
      refetch();
      setEditUserDialog(null);
      setEditName('');
      setEditEmail('');
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success('User deleted successfully!');
      refetch();
      setUpdatingUser(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
      setUpdatingUser(null);
    },
  });

  const sendResetEmail = trpc.admin.sendPasswordResetEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`Reset email sent to ${data.email}`);
      setSendingResetEmail(null);
    },
    onError: (error) => {
      toast.error(`Failed to send reset email: ${error.message}`);
      setSendingResetEmail(null);
    },
  });

  const sendBulkResetEmails = trpc.admin.sendBulkPasswordResetEmails.useMutation({
    onSuccess: (data) => {
      toast.success(`Sent ${data.sent} reset emails${data.failed > 0 ? ` (${data.failed} failed)` : ''}`);
      setSelectedUsers(new Set());
    },
    onError: (error) => {
      toast.error(`Bulk send failed: ${error.message}`);
    },
  });

  const handleSendResetEmail = (userId: string) => {
    setSendingResetEmail(userId);
    sendResetEmail.mutate({ userId });
  };

  const handleBulkSendResetEmails = () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`Send password reset emails to ${selectedUsers.size} user(s)?`)) return;
    sendBulkResetEmails.mutate({ userIds: Array.from(selectedUsers) });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const nonAdminUsers = filteredUsers.filter(u => u.role !== 'ADMIN');
    if (selectedUsers.size === nonAdminUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(nonAdminUsers.map(u => u.id)));
    }
  };

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

  const handleRestoreMembership = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to restore the membership for ${userName}? This will reactivate their subscription.`)) {
      setUpdatingUser(userId);
      await restoreSubscription.mutateAsync({ userId });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string, userEmail: string) => {
    const confirmMessage = `⚠️ WARNING: This action cannot be undone!\n\nAre you sure you want to permanently delete the user "${userName}" (${userEmail})?\n\nThis will delete:\n- User account\n- All projects\n- All subscription data\n- All payment history\n\nType "DELETE" to confirm.`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput === 'DELETE') {
      setUpdatingUser(userId);
      await deleteUser.mutateAsync({ userId });
    } else if (userInput !== null) {
      toast.error('Deletion cancelled. You must type "DELETE" to confirm.');
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewPassword(password);
    setGeneratedPassword(password);
    setShowPassword(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordDialog || !newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    await resetPassword.mutateAsync({
      userId: resetPasswordDialog.userId,
      newPassword,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    toast.success('Password copied to clipboard!');
  };

  const handleUpdateUser = async () => {
    if (!editUserDialog) return;

    // Validate inputs
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!editEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      toast.error('Valid email is required');
      return;
    }

    await updateUser.mutateAsync({
      userId: editUserDialog.userId,
      name: editName,
      email: editEmail,
    });
  };

  // Filter users based on search query (case-insensitive, search by name and email)
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim() && paymentMethodFilter === 'all') return users;
    
    const query = searchQuery.toLowerCase().trim();
    let filtered = users;
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        (user.name?.toLowerCase() || '').includes(query)
      );
    }
    
    // Apply payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(user => {
        const method = getPaymentMethod(user);
        return method.toLowerCase() === paymentMethodFilter.toLowerCase();
      });
    }
    
    return filtered;
  }, [users, searchQuery, paymentMethodFilter]);

  // Helper function to determine payment method
  const getPaymentMethod = (user: any): string => {
    if (!user.subscription) return 'None';
    
    const plan = user.subscription.plan;
    const payments = user.payments || [];
    
    // Free plan
    if (plan.price === 0) return 'Free';
    
    // Check if has payment records
    if (payments.length > 0) {
      const lastPayment = payments[0]; // Most recent payment
      if (lastPayment.paymentMethod === 'paypal') return 'PayPal';
      if (lastPayment.paymentMethod === 'stripe') return 'Stripe';
    }
    
    // Check if has Stripe customer ID
    if (user.subscription.stripeCustomerId) return 'Stripe';
    
    // Paid plan but no payment records - Manual
    return 'Manual';
  };

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
            <div className="flex items-center gap-3">
              {selectedUsers.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleBulkSendResetEmails}
                  disabled={sendBulkResetEmails.isPending}
                  className="bg-gradient-to-r from-blue-500 to-sky-500"
                  data-testid="bulk-send-reset-btn"
                >
                  {sendBulkResetEmails.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Reset Email ({selectedUsers.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="border-2"
                data-testid="select-all-users-btn"
              >
                {selectedUsers.size > 0 && selectedUsers.size === filteredUsers.filter(u => u.role !== 'ADMIN').length ? (
                  <><CheckSquare className="h-4 w-4 mr-2 text-sky-500" />Deselect All</>
                ) : (
                  <><Square className="h-4 w-4 mr-2" />Select All</>
                )}
              </Button>
              
              {/* Payment Method Filter */}
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className="w-48 border-2">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
              
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Card key={user.id} className="border-2 hover:border-navy-400 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Selection Checkbox */}
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUserSelection(user.id)}
                          className="flex-shrink-0 text-gray-400 hover:text-sky-500 transition-colors"
                          data-testid={`select-user-${user.id}`}
                        >
                          {selectedUsers.has(user.id) ? (
                            <CheckSquare className="h-5 w-5 text-sky-500" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      )}

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
                          <button
                            onClick={() => {
                              setEditUserDialog({
                                open: true,
                                userId: user.id,
                                currentName: user.name || '',
                                currentEmail: user.email,
                              });
                              setEditName(user.name || '');
                              setEditEmail(user.email);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Edit user"
                          >
                            <Edit className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                          </button>
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
                          <div className="flex flex-col gap-1">
                            <Badge 
                              className={
                                user.subscription.status === 'CANCELED' 
                                  ? 'bg-red-500 text-white' 
                                  : 'bg-gradient-to-r from-navy-500 to-sky-500 text-white'
                              }
                            >
                              {user.subscription.plan.name}
                            </Badge>
                            {user.subscription.status === 'CANCELED' && (
                              <Badge variant="outline" className="text-red-600 border-red-300">
                                Canceled
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">No Plan</Badge>
                        )}
                      </div>

                      {/* Payment Method */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-600 mb-2">Payment Method</p>
                        {(() => {
                          const method = getPaymentMethod(user);
                          const badgeClass = 
                            method === 'Stripe' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                            method === 'PayPal' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                            method === 'Manual' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                            method === 'Free' ? 'bg-green-100 text-green-700 border-green-300' :
                            'bg-gray-100 text-gray-600 border-gray-300';
                          
                          return (
                            <Badge variant="outline" className={badgeClass}>
                              {method}
                            </Badge>
                          );
                        })()}
                      </div>

                      {/* Plan Selector */}
                      <div className="flex-shrink-0 w-64">
                        <Select
                          value={user.subscription?.planId || ''}
                          onValueChange={(planId) => handlePlanChange(user.id, planId)}
                          disabled={updatingUser === user.id || user.subscription?.status === 'CANCELED'}
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

                      {/* Cancel/Restore Membership Button */}
                      {user.subscription && (
                        <div className="flex-shrink-0">
                          {user.subscription.status === 'CANCELED' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreMembership(user.id, user.name || user.email)}
                              disabled={updatingUser === user.id}
                              className="border-2 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore Membership
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelMembership(user.id, user.name || user.email)}
                              disabled={updatingUser === user.id}
                              className="border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Membership
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Reset Password Button */}
                      {user.role !== 'ADMIN' && (
                        <div className="flex-shrink-0 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendResetEmail(user.id)}
                            disabled={sendingResetEmail === user.id}
                            className="border-2 border-sky-300 text-sky-600 hover:bg-sky-50 hover:border-sky-400"
                            data-testid={`send-reset-email-${user.id}`}
                          >
                            {sendingResetEmail === user.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Send Reset Email
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetPasswordDialog({ open: true, userId: user.id, userName: user.name || user.email });
                              setNewPassword('');
                              setGeneratedPassword('');
                              setShowPassword(false);
                            }}
                            className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Set Password
                          </Button>
                        </div>
                      )}

                      {/* Delete User Button */}
                      {user.role !== 'ADMIN' && (
                        <div className="flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name || 'User', user.email)}
                            disabled={updatingUser === user.id}
                            className="border-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600"
                          >
                            {updatingUser === user.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete User
                          </Button>
                        </div>
                      )}
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

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog?.open || false} onOpenChange={(open) => !open && setResetPasswordDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for <span className="font-semibold">{resetPasswordDialog?.userName}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    title="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {newPassword && newPassword.length < 8 && (
                <p className="text-xs text-red-500">Password must be at least 8 characters</p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={generatePassword}
              className="w-full"
            >
              Generate Secure Password
            </Button>

            {generatedPassword && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-green-800 font-medium mb-1">
                  ✓ Password generated! Make sure to copy and save it securely.
                </p>
                <p className="text-xs text-green-700">
                  The user will need this password to login.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetPasswordDialog(null)}
              disabled={resetPassword.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleResetPassword}
              disabled={resetPassword.isLoading || !newPassword || newPassword.length < 8}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {resetPassword.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog?.open || false} onOpenChange={(open) => !open && setEditUserDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for <span className="font-semibold">{editUserDialog?.currentName || editUserDialog?.currentEmail}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter user name"
              />
              {!editName.trim() && (
                <p className="text-xs text-red-500">Name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter user email"
              />
              {editEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail) && (
                <p className="text-xs text-red-500">Invalid email format</p>
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                ℹ️ Changes will be reflected immediately after saving.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditUserDialog(null)}
              disabled={updateUser.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateUser}
              disabled={
                updateUser.isLoading || 
                !editName.trim() || 
                !editEmail.trim() || 
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)
              }
              className="bg-navy-600 hover:bg-navy-700"
            >
              {updateUser.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
