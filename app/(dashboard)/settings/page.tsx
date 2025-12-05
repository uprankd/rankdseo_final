'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, 
  Lock, 
  Bell, 
  Key, 
  Trash2, 
  CreditCard, 
  Crown,
  Plus,
  Copy,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // API Key state
  const [newKeyName, setNewKeyName] = useState('');

  // Queries
  const { data: preferences, refetch: refetchPreferences } = trpc.settings.getPreferences.useQuery();
  const { data: apiKeys, refetch: refetchApiKeys } = trpc.settings.listApiKeys.useQuery();
  const { data: subscription } = trpc.subscription.getCurrent.useQuery();
  const { data: plans } = trpc.subscription.listPlans.useQuery();

  // Mutations
  const updateProfile = trpc.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully');
      setName('');
      setEmail('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const changePassword = trpc.settings.changePassword.useMutation({
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePreferences = trpc.settings.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Preferences updated');
      refetchPreferences();
    },
  });

  const generateApiKey = trpc.settings.generateApiKey.useMutation({
    onSuccess: () => {
      toast.success('API key generated successfully');
      setNewKeyName('');
      refetchApiKeys();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteApiKey = trpc.settings.deleteApiKey.useMutation({
    onSuccess: () => {
      toast.success('API key deleted');
      refetchApiKeys();
    },
  });

  const exportData = trpc.settings.exportData.useQuery(undefined, {
    enabled: false,
  });

  const deleteAccount = trpc.settings.deleteAccount.useMutation({
    onSuccess: async () => {
      toast.success('Account deleted successfully');
      await signOut({ callbackUrl: '/' });
    },
  });

  const changePlan = trpc.subscription.updateSubscription.useMutation({
    onSuccess: () => {
      toast.success('Subscription updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpdateProfile = () => {
    if (name || email) {
      updateProfile.mutate({ name: name || undefined, email: email || undefined });
    }
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  const handleGenerateApiKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    generateApiKey.mutate({ name: newKeyName });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const handleDeleteAccount = () => {
    deleteAccount.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-navy-500 to-sky-500 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-gray-600 text-lg">Manage your account and application preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUpdateProfile} 
                disabled={updateProfile.isPending}
                className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-sky-600"
              >
                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleChangePassword} 
                disabled={changePassword.isPending}
                className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-sky-600"
              >
                {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Current Plan
              </CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-paleblue-50 to-pink-50 rounded-lg border-2 border-navy-200">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{subscription.plan.name}</h3>
                      <p className="text-gray-600 mt-1">{subscription.plan.description}</p>
                      <div className="mt-4 flex items-center gap-4">
                        <Badge className="bg-gradient-to-r from-navy-500 to-sky-500 text-white">
                          ${(subscription.plan.price / 100).toFixed(2)} / {subscription.plan.interval}
                        </Badge>
                        <Badge variant="outline">
                          Status: {subscription.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold text-lg mb-4">Upgrade or Change Plan</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {plans?.filter(p => p.id !== subscription.planId).map((plan) => (
                        <Card key={plan.id} className="border-2 hover:border-navy-400 transition-all">
                          <CardHeader>
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-4">
                              <span className="text-3xl font-bold">${(plan.price / 100).toFixed(2)}</span>
                              <span className="text-gray-600"> / {plan.interval}</span>
                            </div>
                            <Button 
                              onClick={() => changePlan.mutate({ planId: plan.id })}
                              disabled={changePlan.isPending}
                              className="w-full"
                              variant="outline"
                            >
                              {changePlan.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Select Plan
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No active subscription</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notif">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive email notifications</p>
                </div>
                <Switch
                  id="email-notif"
                  checked={preferences?.emailNotifications}
                  onCheckedChange={(checked) => 
                    updatePreferences.mutate({ emailNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-opp">New Opportunities</Label>
                  <p className="text-sm text-gray-600">Get notified when new opportunities are added</p>
                </div>
                <Switch
                  id="new-opp"
                  checked={preferences?.notifyNewOpportunities}
                  onCheckedChange={(checked) => 
                    updatePreferences.mutate({ notifyNewOpportunities: checked })
                  }
                  disabled={!preferences?.emailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="link-verif">Link Verification</Label>
                  <p className="text-sm text-gray-600">Get notified about link verification results</p>
                </div>
                <Switch
                  id="link-verif"
                  checked={preferences?.notifyLinkVerification}
                  onCheckedChange={(checked) => 
                    updatePreferences.mutate({ notifyLinkVerification: checked })
                  }
                  disabled={!preferences?.emailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sub-changes">Subscription Changes</Label>
                  <p className="text-sm text-gray-600">Get notified about subscription updates</p>
                </div>
                <Switch
                  id="sub-changes"
                  checked={preferences?.notifySubscriptionChanges}
                  onCheckedChange={(checked) => 
                    updatePreferences.mutate({ notifySubscriptionChanges: checked })
                  }
                  disabled={!preferences?.emailNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                {subscription?.plan.allowApiAccess 
                  ? 'Manage your API keys for programmatic access'
                  : 'API access is not available on your current plan'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription?.plan.allowApiAccess ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="API Key Name (e.g., Production Key)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                    <Button 
                      onClick={handleGenerateApiKey}
                      disabled={generateApiKey.isPending}
                      className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-sky-600 whitespace-nowrap"
                    >
                      {generateApiKey.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Generate
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {apiKeys && apiKeys.length > 0 ? (
                      apiKeys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-4 border-2 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{key.name}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="text-sm bg-gray-100 px-3 py-1 rounded font-mono">
                                {key.key.substring(0, 20)}...{key.key.substring(key.key.length - 8)}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyKey(key.key)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              Created: {new Date(key.createdAt).toLocaleDateString()}
                              {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteApiKey.mutate({ id: key.id })}
                            disabled={deleteApiKey.isPending}
                          >
                            {deleteApiKey.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-600 py-8">No API keys generated yet</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Upgrade your plan to get API access</p>
                  <Button 
                    onClick={() => setActiveTab('subscription')}
                    className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-sky-600"
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showDeleteConfirm ? (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold">Are you absolutely sure?</p>
                  <p className="text-sm text-red-700">
                    This action cannot be undone. This will permanently delete your account and remove all data from our servers.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteAccount.isPending}
                    >
                      {deleteAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Yes, Delete My Account
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
