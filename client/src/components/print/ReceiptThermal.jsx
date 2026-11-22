import React from 'react';
import {
  DEFAULT_LOGO,
  money,
  fmtQty,
  fmtDateTime,
  fmtDate,
  readTotals,
  otherPayments,
  headerLines,
  footerLines,
} from './receiptUtils.js';

const Dash = () => <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />;
const Row = ({ l, r, bold, size }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3mm', fontWeight: bold ? 700 : 400, fontSize: size }}>
    <span>{l}</span>
    <span style={{ textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>{r}</span>
  </div>
);

/** Struk kasir thermal 80mm. Angka dibaca dari data transaksi server. */
export default function ReceiptThermal({ transaction: tx, settings }) {
  const t = readTotals(tx);
  const head = headerLines(settings);
  const foot = footerLines(settings);
  const showLogo = settings?.showLogo !== false;
  const logo = settings?.logoUrl || DEFAULT_LOGO;
  const customerName = tx.customer?.name || tx.customerName || 'Pembeli Umum';
  const others = otherPayments(tx);

  return (
    <div
      style={{
        width: '80mm',
        boxSizing: 'border-box',
        padding: '4mm',
        fontFamily: '"Courier New", ui-monospace, monospace',
        fontSize: '11px',
        lineHeight: 1.35,
        color: '#000',
        background: '#fff',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {showLogo && <img src={logo} alt="" style={{ maxWidth: '52mm', maxHeight: '22mm', objectFit: 'contain', margin: '0 auto 1.5mm', display: 'block' }} />}
        {head.map((line, i) => (
          <div key={i} style={{ fontWeight: i === 0 ? 800 : 400, fontSize: i === 0 ? '13px' : '10px', textTransform: i === 0 ? 'uppercase' : 'none' }}>
            {line}
          </div>
        ))}
      </div>

      <Dash />
      <Row l="No. Nota:" r={<b>{tx.invoiceNumber}</b>} />
      <Row l="Tanggal:" r={fmtDateTime(tx.transactionDate || tx.createdAt)} />
      {settings?.showCashier !== false && <Row l="Kasir:" r={tx.cashier?.name || '-'} />}
      <Row l="Pelanggan:" r={<b>{customerName}</b>} />
      <Dash />

      {(tx.items || []).map((it, i) => (
        <div key={i} style={{ marginBottom: '1.5mm' }}>
          <div style={{ fontWeight: 700 }}>{it.productName}</div>
          <Row l={`${fmtQty(it.qty)} ${it.unitName} x ${money(it.unitPrice)}`} r={<b>{money(it.subtotal)}</b>} />
        </div>
      ))}

      <Dash />
      <Row l="Subtotal:" r={money(t.subtotal)} />
      {t.discount > 0 && <Row l="Diskon:" r={`- ${money(t.discount)}`} />}
      {t.taxAmount > 0 && <Row l={`PPN (${t.taxRate}%):`} r={money(t.taxAmount)} />}
      <div style={{ borderTop: '1px solid #000', marginTop: '1mm', paddingTop: '1mm' }}>
        <Row l="TOTAL:" r={money(t.total)} bold size="14px" />
      </div>

      <div style={{ marginTop: '1.5mm' }}>
        {t.cashReceived > 0 && <Row l="Tunai (diterima):" r={money(t.cashReceived)} />}
        {others.map((p, i) => (
          <Row key={i} l={`${p.label}${p.ref ? ` (${p.ref})` : ''}:`} r={money(p.amount)} />
        ))}
        {t.change > 0 && <Row l="KEMBALIAN:" r={money(t.change)} bold size="13px" />}
        {t.debt > 0 && (
          <>
            <Row l="Sisa Kasbon:" r={<b>{money(t.debt)}</b>} />
            {tx.dueDate && <Row l="Jatuh tempo:" r={fmtDate(tx.dueDate)} />}
          </>
        )}
      </div>

      <Dash />
      <div style={{ textAlign: 'center', fontSize: '10px' }}>
        {settings?.showThanks !== false && foot.map((l, i) => <div key={i}>{l}</div>)}
        <div style={{ marginTop: '1.5mm', fontSize: '9px' }}>Powered by StokMaterial.id</div>
      </div>
    </div>
  );
}
