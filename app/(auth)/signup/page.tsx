'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Check, CreditCard } from 'lucide-react';
import { trpc } from '@/lib/api/client';

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Fetch available plans
  const { data: plansData } = trpc.subscription.getPublicPlans.useQuery();
  const plans = plansData?.plans || [];

  const signUpMutation = trpc.auth.signUp.useMutation();
  const createCheckoutMutation = trpc.payment.createSignupCheckout.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      toast.error('Please select a subscription plan');
      return;
    }
    
    setIsLoading(true);

    try {
      // Find the selected plan details
      const plan = plans.find(p => p.id === selectedPlan);
      
      if (!plan) {
        throw new Error('Plan not found');
      }

      // If plan is free, create account directly
      if (plan.price === 0) {
        await signUpMutation.mutateAsync({
          ...formData,
          planId: selectedPlan,
        });
        toast.success('Account created! Please sign in.');
        router.push('/signin');
        return;
      }

      // For paid plans, create checkout session first
      const checkoutResult = await createCheckoutMutation.mutateAsync({
        email: formData.email,
        name: formData.name,
        planId: selectedPlan,
      });

      if (checkoutResult.isFree) {
        // This shouldn't happen, but handle just in case
        await signUpMutation.mutateAsync({
          ...formData,
          planId: selectedPlan,
        });
        toast.success('Account created! Please sign in.');
        router.push('/signin');
        return;
      }

      // Create user account with PENDING status
      await signUpMutation.mutateAsync({
        ...formData,
        planId: selectedPlan,
        paymentSessionId: checkoutResult.sessionId!,
      });

      // Redirect to Stripe checkout
      if (checkoutResult.url) {
        toast.success('Redirecting to payment...');
        window.location.href = checkoutResult.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error?.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-2xl font-bold">RankdSEO</span>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Account Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Start building better backlinks today</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>

              {/* Plan Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Choose Your Plan</Label>
                <div className="grid gap-3">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => !isLoading && setSelectedPlan(plan.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{plan.name}</h3>
                            {plan.name === '1 Year Membership' && (
                              <Badge className="bg-green-500 text-white text-xs">Best Value</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-blue-600">
                              ${(plan.price / 100).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500">/ {plan.interval}</span>
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedPlan === plan.id
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedPlan === plan.id && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !selectedPlan}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {selectedPlan && plans.find(p => p.id === selectedPlan)?.price === 0 ? (
                      'Create Free Account'
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Continue to Payment
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/signin" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}