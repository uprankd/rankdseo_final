'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard, Mail } from 'lucide-react';

export default function PaymentPendingPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-50 to-white px-4">
      <div className="container max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-yellow-500 h-6 w-6" />
              Payment Required
            </CardTitle>
            <CardDescription>
              Your account is pending payment activation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900 mb-2">
                <strong>Your account was created successfully,</strong> but payment hasn't been completed yet.
              </p>
              <p className="text-xs text-yellow-800">
                Please complete the payment process to activate your account and start using RankdSEO.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Complete Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Sign up again to restart the payment process
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Check Your Email</p>
                  <p className="text-xs text-muted-foreground">
                    You may have received a payment link in your email
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <Button 
                onClick={() => router.push('/signup')}
                className="w-full"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Payment
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Need help?</strong> If you believe you've already paid or have questions, please contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
