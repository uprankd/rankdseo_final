'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/api/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailChangeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  const verifyEmailChange = trpc.settings.verifyEmailChange.useMutation({
    onSuccess: (data) => {
      setStatus('success');
      setMessage(data.message);
    },
    onError: (error) => {
      setStatus('error');
      setMessage(error.message);
    },
  });

  useEffect(() => {
    if (token) {
      verifyEmailChange.mutate({ token });
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {status === 'verifying' && 'Verifying Email Change...'}
            {status === 'success' && '✅ Email Changed Successfully'}
            {status === 'error' && '❌ Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Verifying your email change request...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-green-100 p-4 mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <p className="text-center text-gray-700 mb-4">{message}</p>
              <p className="text-center text-sm text-gray-600 mb-6">
                You can now use your new email address to sign in.
              </p>
              <Link href="/signin">
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  Sign In with New Email
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-red-100 p-4 mb-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <p className="text-center text-gray-700 mb-4">{message}</p>
              <p className="text-center text-sm text-gray-600 mb-6">
                The verification link may have expired or already been used.
              </p>
              <Link href="/settings?tab=profile">
                <Button variant="outline" className="w-full">
                  Back to Settings
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
