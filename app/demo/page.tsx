'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function DemoPage() {
  const [error, setError] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/opportunities';

  useEffect(() => {
    const loginDemo = async () => {
      try {
        const result = await signIn('credentials', {
          email: 'demo@rankdseo.com',
          password: 'demo_view_2026',
          callbackUrl: redirectTo,
          redirect: true,
        });
        if (result?.error) {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };
    loginDemo();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold text-lg mb-4">Unable to load demo. Please try again.</p>
          <a href="/" className="text-blue-600 hover:underline">Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-navy-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <Sparkles className="h-8 w-8 text-sky-500 absolute top-6 left-1/2 transform -translate-x-1/2 animate-pulse" />
        </div>
        <p className="text-gray-700 font-semibold text-lg">Loading platform preview...</p>
      </div>
    </div>
  );
}
