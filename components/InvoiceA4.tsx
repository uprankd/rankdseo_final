'use client';

import { forwardRef } from 'react';

// Company details — update these as needed
const COMPANY = {
  name: 'SIA Uprankd',
  vatNumber: 'LV40203XXXXXX',
  registrationNumber: '40203XXXXXX',
  address: 'Riga, Latvia',
  addressLine2: 'LV-1050',
  email: 'billing@uprankd.com',
  website: 'uprankd.com',
  bank: {
    name: 'Swedbank AS',
    iban: 'LV00HABA0000000000000',
    swift: 'HABALV22',
  },
};

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  status: string;
  customer: {
    name: string;
    email: string;
  };
  items: {
    description: string;
    detail?: string;
    amount: number;
  }[];
  subtotal: number;
  vatRate?: number;
  vatAmount?: number;
  total: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
}

function formatCurrency(amount: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

export const InvoiceA4 = forwardRef<HTMLDivElement, { data: InvoiceData }>(
  ({ data }, ref) => {
    const isPaid = data.status === 'SUCCEEDED';

    return (
      <div
        ref={ref}
        data-testid="invoice-a4-preview"
        className="invoice-a4-page"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 18mm',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize: '10pt',
          color: '#1a1a2e',
          background: '#fff',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.5',
        }}
      >
        {/* Header: Company + INVOICE title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '18pt', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              {COMPANY.name}
            </div>
            <div style={{ fontSize: '8.5pt', color: '#64748b', marginTop: '6px', lineHeight: '1.6' }}>
              {COMPANY.address}<br />
              {COMPANY.addressLine2}<br />
              VAT: {COMPANY.vatNumber}<br />
              Reg. No: {COMPANY.registrationNumber}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26pt', fontWeight: 800, color: '#e2e8f0', letterSpacing: '2px', lineHeight: 1 }}>
              INVOICE
            </div>
            <div style={{ marginTop: '10px', fontSize: '9pt', color: '#64748b' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>{data.invoiceNumber}</span>
            </div>
            <div style={{ marginTop: '4px' }}>
              {isPaid ? (
                <span style={{
                  display: 'inline-block',
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '3px 12px',
                  borderRadius: '4px',
                  fontSize: '8pt',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Paid
                </span>
              ) : (
                <span style={{
                  display: 'inline-block',
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '3px 12px',
                  borderRadius: '4px',
                  fontSize: '8pt',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {data.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '2px', background: '#0f172a', marginBottom: '24px' }} />

        {/* Bill To + Invoice Details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>
              Bill To
            </div>
            <div style={{ fontWeight: 600, fontSize: '11pt', color: '#0f172a' }}>
              {data.customer.name || 'Customer'}
            </div>
            <div style={{ fontSize: '9pt', color: '#64748b' }}>
              {data.customer.email}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <table style={{ borderCollapse: 'collapse', marginLeft: 'auto' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 16px 3px 0', fontSize: '8.5pt', color: '#94a3b8', fontWeight: 600, textAlign: 'left' }}>Invoice Date</td>
                  <td style={{ padding: '3px 0', fontSize: '9pt', fontWeight: 500, color: '#334155' }}>{data.date}</td>
                </tr>
                {data.dueDate && (
                  <tr>
                    <td style={{ padding: '3px 16px 3px 0', fontSize: '8.5pt', color: '#94a3b8', fontWeight: 600, textAlign: 'left' }}>Due Date</td>
                    <td style={{ padding: '3px 0', fontSize: '9pt', fontWeight: 500, color: '#334155' }}>{data.dueDate}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '3px 16px 3px 0', fontSize: '8.5pt', color: '#94a3b8', fontWeight: 600, textAlign: 'left' }}>Payment Method</td>
                  <td style={{ padding: '3px 0', fontSize: '9pt', fontWeight: 500, color: '#334155', textTransform: 'capitalize' }}>{data.paymentMethod}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0' }}>
                Description
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0', width: '120px' }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: '14px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '10pt' }}>{item.description}</div>
                  {item.detail && (
                    <div style={{ fontSize: '8.5pt', color: '#94a3b8', marginTop: '2px' }}>{item.detail}</div>
                  )}
                </td>
                <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(item.amount, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '9pt', color: '#64748b' }}>
              <span>Subtotal</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(data.subtotal, data.currency)}</span>
            </div>
            {data.vatRate != null && data.vatRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '9pt', color: '#64748b' }}>
                <span>VAT ({data.vatRate}%)</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(data.vatAmount || 0, data.currency)}</span>
              </div>
            )}
            <div style={{ height: '2px', background: '#0f172a', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12pt', fontWeight: 800, color: '#0f172a' }}>
              <span>Total</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(data.total, data.currency)}</span>
            </div>
          </div>
        </div>

        {/* Spacer to push footer down */}
        <div style={{ flex: 1 }} />

        {/* Bank Details + Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>
                Bank Details
              </div>
              <div style={{ fontSize: '8.5pt', color: '#64748b', lineHeight: '1.7' }}>
                Bank: {COMPANY.bank.name}<br />
                IBAN: {COMPANY.bank.iban}<br />
                SWIFT/BIC: {COMPANY.bank.swift}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>
                Contact
              </div>
              <div style={{ fontSize: '8.5pt', color: '#64748b', lineHeight: '1.7' }}>
                {COMPANY.email}<br />
                {COMPANY.website}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '7.5pt', color: '#cbd5e1', textAlign: 'center' }}>
            Transaction ID: {data.transactionId}
          </div>
        </div>
      </div>
    );
  }
);

InvoiceA4.displayName = 'InvoiceA4';
