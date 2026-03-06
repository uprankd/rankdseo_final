'use client';

import { useEffect } from 'react';
import { InvoiceA4, printInvoice, type InvoiceData } from '@/components/InvoiceA4';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

export function InvoicePageClient({ data }: { data: InvoiceData }) {
  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '24px 0' }}>
      {/* Action bar */}
      <div style={{ maxWidth: '860px', margin: '0 auto 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '0 16px' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => printInvoice(data)}
          data-testid="invoice-page-print-btn"
          className="bg-white"
        >
          <Printer className="h-4 w-4 mr-1.5" />
          Print / Save PDF
        </Button>
      </div>

      {/* Invoice */}
      <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.1)', borderRadius: '2px', background: '#fff' }}>
          <InvoiceA4 data={data} />
        </div>
      </div>
    </div>
  );
}
