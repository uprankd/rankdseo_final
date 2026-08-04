import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VerifyEmailChangeContent from './VerifyEmailChangeContent';

export default function VerifyEmailChangePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailChangeContent />
    </Suspense>
  );
}
