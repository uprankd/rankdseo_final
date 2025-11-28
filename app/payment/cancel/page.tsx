'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancelPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="container max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="text-orange-500 h-6 w-6" />
              Payment Cancelled
            </CardTitle>
            <CardDescription>
              Your payment process was cancelled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900">
                No charges have been made to your account.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You can try signing up again whenever you're ready. If you encountered any issues, please don't hesitate to contact our support team.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Need help?</p>
              <p className="text-xs text-blue-800">
                If you have questions about our pricing or plans, feel free to reach out to our support team.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
            <Button 
              onClick={() => router.push('/signup')}
              className="flex-1"
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
