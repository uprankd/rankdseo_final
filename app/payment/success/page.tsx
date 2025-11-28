'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [pollingCount, setPollingCount] = useState(0);
  
  const { data, isLoading, refetch } = trpc.payment.getCheckoutStatus.useQuery(
    { sessionId: sessionId || '' },
    { enabled: !!sessionId }
  );
  
  // Poll for payment status
  useEffect(() => {
    if (!sessionId) return;
    
    const maxPolls = 10;
    const pollInterval = 2000; // 2 seconds
    
    if (
      pollingCount < maxPolls && 
      (!data || data.payment_status !== 'paid')
    ) {
      const timer = setTimeout(() => {
        refetch();
        setPollingCount(prev => prev + 1);
      }, pollInterval);
      
      return () => clearTimeout(timer);
    }
  }, [sessionId, data, pollingCount, refetch]);
  
  if (!sessionId) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-red-500" />
              Invalid Session
            </CardTitle>
            <CardDescription>
              No payment session found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Unable to verify your payment. Please contact support if you believe this is an error.</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading || (pollingCount < 10 && (!data || data.payment_status !== 'paid'))) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="animate-spin" />
              Verifying Payment
            </CardTitle>
            <CardDescription>
              Please wait while we confirm your payment...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                Processing your payment
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                Activating your account
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                This may take a few moments. Please don't close this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isSuccess = data && data.payment_status === 'paid';
  const userEmail = data?.customer_email || data?.transaction?.user?.email;
  const planName = data?.metadata?.planName || 'Selected Plan';
  
  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle2 className="text-green-500 h-6 w-6" />
                Payment Successful!
              </>
            ) : (
              <>
                <AlertCircle className="text-yellow-500 h-6 w-6" />
                Payment Processing
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isSuccess 
              ? 'Your payment has been processed and your account is now active' 
              : 'Your payment is still being processed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-green-900">🎉 Welcome to RankdSEO!</p>
              <p className="text-sm text-green-800">
                Your <strong>{planName}</strong> subscription is now active.
              </p>
              {userEmail && (
                <p className="text-sm text-green-700">
                  A receipt has been sent to <strong>{userEmail}</strong>
                </p>
              )}
            </div>
          )}
          
          {data && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className="font-medium capitalize">{data.payment_status || data.status}</span>
              </div>
              {data.amount_total && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium">
                    ${(data.amount_total / 100).toFixed(2)} {data.currency?.toUpperCase()}
                  </span>
                </div>
              )}
              {planName && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{planName}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 space-y-2">
            {isSuccess ? (
              <Link href="/signin" className="block">
                <Button className="w-full" size="lg">
                  Sign In to Your Account
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="w-full"
                disabled={pollingCount >= 10}
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Status...
              </Button>
            )}
          </div>

          {isSuccess && (
            <p className="text-xs text-center text-muted-foreground">
              You can now sign in using your email and password to access your dashboard.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-md py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
