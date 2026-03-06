'use client';

import { forwardRef } from 'react';

const COMPANY = {
  name: 'SIA Uprankd',
  vatNumber: 'LV44103141201',
  registrationNumber: '44103141201',
  address: 'Brivibas street 40 - 20B, Riga, Latvia',
  addressLine2: 'LV-1050',
  email: 'billing@uprankd.com',
  website: 'uprankd.com',
  bank: {
    name: 'AS Swedbank',
    iban: 'LV45HABA0551047882578',
    swift: 'HABALV22',
  },
};

export interface InvoiceData {
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

function fmtCurrency(amount: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Opens a new window with only the invoice and triggers print */
export function printInvoice(data: InvoiceData) {
  const isPaid = data.status === 'SUCCEEDED';
  const statusBadge = isPaid
    ? '<span style="display:inline-block;background:#dcfce7;color:#166534;padding:3px 12px;border-radius:4px;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Paid</span>'
    : `<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:3px 12px;border-radius:4px;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${data.status}</span>`;

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #f1f5f9">
        <div style="font-weight:600;color:#0f172a;font-size:10pt">${item.description}</div>
        ${item.detail ? `<div style="font-size:8.5pt;color:#94a3b8;margin-top:2px">${item.detail}</div>` : ''}
      </td>
      <td style="padding:12px;text-align:right;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;font-variant-numeric:tabular-nums">${fmtCurrency(item.amount, data.currency)}</td>
    </tr>
  `).join('');

  const vatRow = data.vatRate != null && data.vatRate > 0
    ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:9pt;color:#64748b"><span>VAT (${data.vatRate}%)</span><span style="font-variant-numeric:tabular-nums">${fmtCurrency(data.vatAmount || 0, data.currency)}</span></div>`
    : '';

  const logoUrl = window.location.origin + '/logo.png';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${data.invoiceNumber}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #1a1a2e; line-height: 1.5; }
  .page { width: 210mm; padding: 16mm 18mm; }
</style>
</head>
<body>
<div class="page">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
    <div>
      <img src="${logoUrl}" alt="${COMPANY.name}" style="height:44px;width:auto;margin-bottom:4px" />
      <div style="font-size:11pt;font-weight:700;color:#0f172a">${COMPANY.name}</div>
      <div style="font-size:8.5pt;color:#64748b;margin-top:4px;line-height:1.6">
        ${COMPANY.address}<br>${COMPANY.addressLine2}<br>VAT: ${COMPANY.vatNumber}<br>Reg. No: ${COMPANY.registrationNumber}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:24pt;font-weight:800;color:#e2e8f0;letter-spacing:2px;line-height:1">INVOICE</div>
      <div style="margin-top:8px;font-size:9pt;color:#64748b"><span style="font-weight:600;color:#334155">${data.invoiceNumber}</span></div>
      <div style="margin-top:4px">${statusBadge}</div>
    </div>
  </div>

  <div style="height:2px;background:#0f172a;margin-bottom:20px"></div>

  <div style="display:flex;justify-content:space-between;margin-bottom:28px">
    <div>
      <div style="font-size:7.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:1px;margin-bottom:4px">Bill To</div>
      <div style="font-weight:600;font-size:11pt;color:#0f172a">${data.customer.name || 'Customer'}</div>
      <div style="font-size:9pt;color:#64748b">${data.customer.email}</div>
    </div>
    <div style="text-align:right">
      <table style="border-collapse:collapse;margin-left:auto">
        <tr>
          <td style="padding:2px 14px 2px 0;font-size:8.5pt;color:#94a3b8;font-weight:600;text-align:left">Invoice Date</td>
          <td style="padding:2px 0;font-size:9pt;font-weight:500;color:#334155">${data.date}</td>
        </tr>
        ${data.dueDate ? `<tr><td style="padding:2px 14px 2px 0;font-size:8.5pt;color:#94a3b8;font-weight:600;text-align:left">Due Date</td><td style="padding:2px 0;font-size:9pt;font-weight:500;color:#334155">${data.dueDate}</td></tr>` : ''}
        <tr>
          <td style="padding:2px 14px 2px 0;font-size:8.5pt;color:#94a3b8;font-weight:600;text-align:left">Payment Method</td>
          <td style="padding:2px 0;font-size:9pt;font-weight:500;color:#334155;text-transform:capitalize">${data.paymentMethod}</td>
        </tr>
      </table>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;font-size:8pt;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">Description</th>
        <th style="padding:8px 12px;text-align:right;font-size:8pt;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.5px;border-bottom:2px solid #e2e8f0;width:120px">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:28px">
    <div style="width:220px">
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:9pt;color:#64748b">
        <span>Subtotal</span><span style="font-variant-numeric:tabular-nums">${fmtCurrency(data.subtotal, data.currency)}</span>
      </div>
      ${vatRow}
      <div style="height:2px;background:#0f172a;margin:6px 0"></div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12pt;font-weight:800;color:#0f172a">
        <span>Total</span><span style="font-variant-numeric:tabular-nums">${fmtCurrency(data.total, data.currency)}</span>
      </div>
    </div>
  </div>

  <div style="border-top:1px solid #e2e8f0;padding-top:14px;margin-top:20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:7.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:1px;margin-bottom:4px">Bank Details</div>
        <div style="font-size:8.5pt;color:#64748b;line-height:1.7">Bank: ${COMPANY.bank.name}<br>IBAN: ${COMPANY.bank.iban}<br>SWIFT/BIC: ${COMPANY.bank.swift}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:7.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:1px;margin-bottom:4px">Contact</div>
        <div style="font-size:8.5pt;color:#64748b;line-height:1.7">${COMPANY.email}<br>${COMPANY.website}</div>
      </div>
    </div>
    <div style="margin-top:12px;font-size:7.5pt;color:#cbd5e1;text-align:center">Transaction ID: ${data.transactionId}</div>
  </div>
</div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
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
          padding: '16mm 18mm',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize: '10pt',
          color: '#1a1a2e',
          background: '#fff',
          boxSizing: 'border-box',
          lineHeight: '1.5',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <img src="/logo.png" alt={COMPANY.name} style={{ height: '48px', width: 'auto', marginBottom: '6px' }} />
            <div style={{ fontSize: '11pt', fontWeight: 700, color: '#0f172a' }}>{COMPANY.name}</div>
            <div style={{ fontSize: '8.5pt', color: '#64748b', marginTop: '6px', lineHeight: '1.6' }}>
              {COMPANY.address}<br />{COMPANY.addressLine2}<br />VAT: {COMPANY.vatNumber}<br />Reg. No: {COMPANY.registrationNumber}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26pt', fontWeight: 800, color: '#e2e8f0', letterSpacing: '2px', lineHeight: 1 }}>INVOICE</div>
            <div style={{ marginTop: '10px', fontSize: '9pt', color: '#64748b' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>{data.invoiceNumber}</span>
            </div>
            <div style={{ marginTop: '4px' }}>
              {isPaid ? (
                <span style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '3px 12px', borderRadius: '4px', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paid</span>
              ) : (
                <span style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '3px 12px', borderRadius: '4px', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{data.status}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: '2px', background: '#0f172a', marginBottom: '24px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>Bill To</div>
            <div style={{ fontWeight: 600, fontSize: '11pt', color: '#0f172a' }}>{data.customer.name || 'Customer'}</div>
            <div style={{ fontSize: '9pt', color: '#64748b' }}>{data.customer.email}</div>
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

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0' }}>Description</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0', width: '120px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: '14px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '10pt' }}>{item.description}</div>
                  {item.detail && <div style={{ fontSize: '8.5pt', color: '#94a3b8', marginTop: '2px' }}>{item.detail}</div>}
                </td>
                <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtCurrency(item.amount, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '9pt', color: '#64748b' }}>
              <span>Subtotal</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(data.subtotal, data.currency)}</span>
            </div>
            {data.vatRate != null && data.vatRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '9pt', color: '#64748b' }}>
                <span>VAT ({data.vatRate}%)</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(data.vatAmount || 0, data.currency)}</span>
              </div>
            )}
            <div style={{ height: '2px', background: '#0f172a', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12pt', fontWeight: 800, color: '#0f172a' }}>
              <span>Total</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(data.total, data.currency)}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>Bank Details</div>
              <div style={{ fontSize: '8.5pt', color: '#64748b', lineHeight: '1.7' }}>
                Bank: {COMPANY.bank.name}<br />IBAN: {COMPANY.bank.iban}<br />SWIFT/BIC: {COMPANY.bank.swift}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>Contact</div>
              <div style={{ fontSize: '8.5pt', color: '#64748b', lineHeight: '1.7' }}>{COMPANY.email}<br />{COMPANY.website}</div>
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
