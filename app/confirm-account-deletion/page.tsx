import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmAccountDeletionContent from './ConfirmAccountDeletionContent';

export default function ConfirmAccountDeletionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white px-4">
          <Card className="w-full max-w-md border-red-200">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-red-600">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <ConfirmAccountDeletionContent />
    </Suspense>
  );
}
