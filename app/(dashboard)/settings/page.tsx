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
  Loader2,
  Tag
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle tab selection from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'subscription', 'preferences', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Handle upgrade success/cancel from Stripe redirect
  useEffect(() => {
    const upgradeStatus = searchParams.get('upgrade');
    if (upgradeStatus === 'success') {
      toast.success('🎉 Payment successful! Your plan has been upgraded.');
      setActiveTab('subscription');
      // Remove query param from URL
      router.replace('/settings?tab=subscription');
    } else if (upgradeStatus === 'cancelled') {
      toast.error('Payment was cancelled. Your plan remains unchanged.');
      setActiveTab('subscription');
      router.replace('/settings?tab=subscription');
    }
  }, [searchParams, router]);

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Coupon state for upgrades
  const [couponCodes, setCouponCodes] = useState<Record<string, string>>({});
  // PayPal upgrade state
  const [paymentMethods, setPaymentMethods] = useState<Record<string, 'stripe' | 'paypal'>>({});
  const [paypalPlanId, setPaypalPlanId] = useState<string | null>(null);

  // Queries
  const { data: preferences, refetch: refetchPreferences } = trpc.settings.getPreferences.useQuery();
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

  // API key mutations removed

  const deleteAccount = trpc.settings.deleteAccount.useMutation({
    onSuccess: async () => {
      toast.success('Account deleted successfully');
      await signOut({ callbackUrl: '/' });
    },
  });

  const changePlan = trpc.subscription.createUpgradeCheckout.useMutation({
    onSuccess: (data) => {
      if (data.requiresPayment && data.checkoutUrl) {
        // Redirect to Stripe checkout
        toast.success('Redirecting to payment...');
        window.location.href = data.checkoutUrl;
      } else {
        // Plan upgraded without payment (free plan or 100% coupon)
        toast.success(data.message || 'Subscription updated successfully');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createPayPalUpgrade = trpc.subscription.createPayPalUpgradeOrder.useMutation();
  const capturePayPalUpgrade = trpc.subscription.capturePayPalUpgradePayment.useMutation();

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

  // API key handlers removed

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
                            <ul className="text-sm text-gray-600 mb-4 space-y-2">
                              <li>✓ {plan.maxOpportunities} backlink opportunities</li>
                              <li>✓ {plan.maxProjects} projects</li>
                              <li>✓ Priority support</li>
                            </ul>
                            
                            {/* Coupon Code Input */}
                            {plan.price > 0 && (
                              <div className="mb-4">
                                <Label htmlFor={`coupon-${plan.id}`} className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Have a coupon code?
                                </Label>
                                <Input
                                  id={`coupon-${plan.id}`}
                                  type="text"
                                  placeholder="Enter coupon code"
                                  value={couponCodes[plan.id] || ''}
                                  onChange={(e) => setCouponCodes(prev => ({
                                    ...prev,
                                    [plan.id]: e.target.value.toUpperCase()
                                  }))}
                                  className="border-2 font-mono"
                                />
                                {couponCodes[plan.id] && (
                                  <p className="text-xs text-green-600 mt-1">
                                    ✓ Coupon will be applied at checkout
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Payment Method Selection for paid plans */}
                            {plan.price > 0 && paypalPlanId !== plan.id && (
                              <div className="mb-4">
                                <Label className="text-sm text-gray-600 mb-2 block">Payment Method</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    data-testid={`payment-stripe-${plan.id}`}
                                    onClick={() => setPaymentMethods(prev => ({ ...prev, [plan.id]: 'stripe' }))}
                                    className={`p-3 border-2 rounded-lg transition-all text-center ${
                                      (paymentMethods[plan.id] || 'stripe') === 'stripe'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                  >
                                    <CreditCard className="h-4 w-4 mx-auto mb-1" />
                                    <span className="text-xs font-semibold">Card</span>
                                  </button>
                                  <button
                                    type="button"
                                    data-testid={`payment-paypal-${plan.id}`}
                                    onClick={() => setPaymentMethods(prev => ({ ...prev, [plan.id]: 'paypal' }))}
                                    className={`p-3 border-2 rounded-lg transition-all text-center ${
                                      paymentMethods[plan.id] === 'paypal'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                  >
                                    <svg className="h-4 w-4 mx-auto mb-1" viewBox="0 0 24 24" fill="#003087">
                                      <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.147a.802.802 0 01-.793.679H7.72a.483.483 0 01-.477-.558L9.28 7.813a.962.962 0 01.949-.813h5.366c.693 0 1.311.058 1.844.174a5.45 5.45 0 011.628.578z"/>
                                    </svg>
                                    <span className="text-xs font-semibold">PayPal</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* PayPal Buttons */}
                            {plan.price > 0 && paypalPlanId === plan.id ? (
                              <div className="space-y-3" data-testid={`paypal-buttons-${plan.id}`}>
                                <Label className="text-sm font-semibold">Complete Payment with PayPal</Label>
                                <PayPalScriptProvider options={{
                                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                                  currency: 'USD',
                                }}>
                                  <PayPalButtons
                                    style={{ layout: 'vertical', height: 40 }}
                                    createOrder={async () => {
                                      try {
                                        const result = await createPayPalUpgrade.mutateAsync({
                                          planId: plan.id,
                                          couponCode: couponCodes[plan.id] || undefined,
                                        });
                                        if (!result.requiresPayment) {
                                          toast.success(result.message || 'Plan updated!');
                                          setTimeout(() => window.location.reload(), 1500);
                                          return '';
                                        }
                                        return result.orderId || '';
                                      } catch (error: any) {
                                        toast.error(error.message || 'Failed to create PayPal order');
                                        setPaypalPlanId(null);
                                        throw error;
                                      }
                                    }}
                                    onApprove={async (data) => {
                                      try {
                                        const result = await capturePayPalUpgrade.mutateAsync({ orderId: data.orderID });
                                        toast.success(`Plan upgraded to ${result.planName}!`);
                                        setTimeout(() => window.location.reload(), 1500);
                                      } catch (error: any) {
                                        toast.error(error.message || 'Payment capture failed');
                                        setPaypalPlanId(null);
                                      }
                                    }}
                                    onError={() => {
                                      toast.error('PayPal payment failed. Please try again.');
                                      setPaypalPlanId(null);
                                    }}
                                    onCancel={() => {
                                      toast.info('Payment cancelled');
                                      setPaypalPlanId(null);
                                    }}
                                  />
                                </PayPalScriptProvider>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => setPaypalPlanId(null)}
                                  data-testid={`paypal-cancel-${plan.id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                onClick={() => {
                                  if (plan.price > 0 && paymentMethods[plan.id] === 'paypal') {
                                    setPaypalPlanId(plan.id);
                                  } else {
                                    changePlan.mutate({ 
                                      planId: plan.id,
                                      couponCode: couponCodes[plan.id] || undefined
                                    });
                                  }
                                }}
                                disabled={changePlan.isPending}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                data-testid={`upgrade-btn-${plan.id}`}
                              >
                                {changePlan.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    {plan.price > 0 ? (
                                      <>
                                        {paymentMethods[plan.id] === 'paypal' ? (
                                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.147a.802.802 0 01-.793.679H7.72a.483.483 0 01-.477-.558L9.28 7.813a.962.962 0 01.949-.813h5.366c.693 0 1.311.058 1.844.174a5.45 5.45 0 011.628.578z"/>
                                          </svg>
                                        ) : (
                                          <CreditCard className="mr-2 h-4 w-4" />
                                        )}
                                        Upgrade & Pay
                                      </>
                                    ) : (
                                      'Select Plan'
                                    )}
                                  </>
                                )}
                              </Button>
                            )}
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
                API Access
              </CardTitle>
              <CardDescription>
                Programmatic access to RankdSEO features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-6">
                  <Key className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Coming Soon</h3>
                <p className="text-gray-600 max-w-md mb-6">
                  We're working on bringing you powerful API access to integrate RankdSEO into your workflows. 
                  Stay tuned for updates!
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span>In Development</span>
                </div>
              </div>
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
