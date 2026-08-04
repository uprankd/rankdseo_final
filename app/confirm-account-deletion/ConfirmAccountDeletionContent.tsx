'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/api/client';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmAccountDeletionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'pending' | 'deleting' | 'deleted' | 'error'>('pending');
  const [message, setMessage] = useState('');

  const confirmDeletion = trpc.settings.confirmAccountDeletion.useMutation({
    onSuccess: (data) => {
      setStatus('deleted');
      setMessage(data.message);
      // Redirect to homepage after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    },
    onError: (error) => {
      setStatus('error');
      setMessage(error.message);
    },
  });

  const handleConfirmDeletion = () => {
    if (token) {
      setStatus('deleting');
      confirmDeletion.mutate({ token });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-red-600">
              ❌ Invalid Link
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-700 mb-4">No deletion token provided.</p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white px-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-red-600">
            {status === 'pending' && '⚠️ Confirm Account Deletion'}
            {status === 'deleting' && '🗑️ Deleting Account...'}
            {status === 'deleted' && '✅ Account Deleted'}
            {status === 'error' && '❌ Deletion Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'pending' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 mb-2">
                      ⛔ This action cannot be undone
                    </p>
                    <p className="text-sm text-red-700 mb-3">
                      By confirming, you will permanently delete:
                    </p>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      <li>Your account and profile</li>
                      <li>All your projects and campaigns</li>
                      <li>Your subscription and billing history</li>
                      <li>All saved opportunities and data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={handleConfirmDeletion}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Yes, Permanently Delete My Account
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/settings?tab=account')}
                >
                  Cancel - Keep My Account
                </Button>
              </div>
            </div>
          )}

          {status === 'deleting' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-red-600 mb-4" />
              <p className="text-gray-600">Deleting your account...</p>
            </div>
          )}

          {status === 'deleted' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <Trash2 className="h-12 w-12 text-gray-600" />
              </div>
              <p className="text-center text-gray-700 mb-2 font-semibold">
                Your account has been deleted
              </p>
              <p className="text-center text-sm text-gray-600 mb-4">
                All your data has been permanently removed.
              </p>
              <p className="text-center text-sm text-gray-500">
                Redirecting to homepage in 3 seconds...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-red-100 p-4 mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <p className="text-center text-gray-700 mb-4">{message}</p>
              <p className="text-center text-sm text-gray-600 mb-6">
                The deletion link may have expired or already been used.
              </p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
