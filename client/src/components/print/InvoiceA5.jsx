import React from 'react';
import {
  DEFAULT_LOGO,
  money,
  fmtQty,
  fmtDate,
  readTotals,
  otherPayments,
  headerLines,
  STATUS_LABEL,
} from './receiptUtils.js';

const th = { padding: '2mm 1.5mm', textAlign: 'left', fontWeight: 700, borderTop: '0.4mm solid #000', borderBottom: '0.4mm solid #000', background: '#F7F4ED' };
const td = { padding: '1.8mm 1.5mm', borderBottom: '0.2mm solid #bbb', verticalAlign: 'top' };

const Line = ({ l, r, bold, big }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6mm', padding: '0.6mm 0', fontWeight: bold ? 800 : 400, fontSize: big ? '11pt' : undefined }}>
    <span>{l}</span>
    <span style={{ whiteSpace: 'nowrap' }}>{r}</span>
  </div>
);

/** Surat Jalan & Faktur A5 (148 x 210 mm). Angka dibaca dari data transaksi server. */
export default function InvoiceA5({ transaction: tx, settings }) {
  const t = readTotals(tx);
  const head = headerLines(settings);
  const showLogo = settings?.showLogo !== false;
  const logo = settings?.logoUrl || DEFAULT_LOGO;
  const customer = tx.customer || null;
  const customerName = customer?.name || tx.customerName || 'Pembeli Umum';
  const others = otherPayments(tx).filter((p) => p.label !== 'Kasbon');
  const sig = { textAlign: 'center', fontSize: '8pt' };

  return (
    <div
      style={{
        width: '148mm',
        minHeight: '210mm',
        boxSizing: 'border-box',
        padding: '9mm',
        fontFamily: 'Manrope, "Segoe UI", Arial, sans-serif',
        fontSize: '9pt',
        lineHeight: 1.4,
        color: '#000',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Kop */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '5mm', borderBottom: '0.6mm solid #234536', paddingBottom: '3mm' }}>
        <div style={{ display: 'flex', gap: '3mm', alignItems: 'center', minWidth: 0 }}>
          {showLogo && <img src={logo} alt="" style={{ width: '24mm', height: '16mm', objectFit: 'contain' }} />}
          <div>
            {head.map((line, i) => (
              <div key={i} style={{ fontWeight: i === 0 ? 800 : 400, fontSize: i === 0 ? '12pt' : '8pt', color: i === 0 ? '#234536' : '#333', textTransform: i === 0 ? 'uppercase' : 'none' }}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '11pt' }}>SURAT JALAN &amp; FAKTUR</div>
          <div style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, marginTop: '1mm' }}>{tx.invoiceNumber}</div>
          <div style={{ fontSize: '8pt', color: '#444' }}>{fmtDate(tx.transactionDate || tx.createdAt)}</div>
        </div>
      </div>

      {/* Tujuan & status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6mm', margin: '4mm 0', fontSize: '8.5pt' }}>
        <div>
          <div style={{ fontSize: '7pt', fontWeight: 700, color: '#555' }}>TUJUAN PENGIRIMAN / MANDOR:</div>
          <div style={{ fontWeight: 800, fontSize: '10.5pt' }}>{customerName}</div>
          <div>{customer?.address || 'Ambil Sendiri di Toko'}</div>
          {customer?.phone && <div>Telp: {customer.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '7pt', fontWeight: 700, color: '#555' }}>STATUS PEMBAYARAN:</div>
          <div style={{ fontWeight: 800, fontSize: '10.5pt', color: tx.paymentStatus === 'PAID' ? '#16845B' : '#C62828' }}>
            {STATUS_LABEL[tx.paymentStatus] || tx.paymentStatus}
          </div>
          {t.debt > 0 && tx.dueDate && <div>Jatuh tempo: {fmtDate(tx.dueDate)}</div>}
        </div>
      </div>

      {/* Tabel barang */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: '8mm' }}>No</th>
            <th style={th}>Nama Material</th>
            <th style={{ ...th, width: '24mm', textAlign: 'center' }}>Banyaknya</th>
            <th style={{ ...th, width: '25mm', textAlign: 'right' }}>Harga Satuan</th>
            <th style={{ ...th, width: '27mm', textAlign: 'right' }}>Jumlah (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {(tx.items || []).map((it, i) => (
            <tr key={i} style={{ pageBreakInside: 'avoid' }}>
              <td style={td}>{i + 1}</td>
              <td style={{ ...td, fontWeight: 700 }}>{it.productName}</td>
              <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{fmtQty(it.qty)} {it.unitName}</td>
              <td style={{ ...td, textAlign: 'right' }}>{money(it.unitPrice)}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{money(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ringkasan angka */}
      <div style={{ marginLeft: 'auto', width: '82mm', marginTop: '3mm', fontSize: '8.5pt' }}>
        <Line l="Subtotal" r={money(t.subtotal)} />
        {t.discount > 0 && <Line l="Diskon" r={`- ${money(t.discount)}`} />}
        {t.taxAmount > 0 && <Line l={`PPN ${t.taxRate}%`} r={money(t.taxAmount)} />}
        <div style={{ borderTop: '0.4mm solid #000', marginTop: '1mm', paddingTop: '1mm' }}>
          <Line l="TOTAL NILAI BARANG" r={money(t.total)} bold big />
        </div>
        {t.cashReceived > 0 && <Line l="Tunai diterima" r={money(t.cashReceived)} />}
        {others.map((p, i) => (
          <Line key={i} l={p.label} r={money(p.amount)} />
        ))}
        {t.change > 0 && <Line l="Kembalian" r={money(t.change)} />}
        {t.debt > 0 && <Line l="Sisa Kasbon (hutang)" r={money(t.debt)} bold />}
      </div>

      {tx.notes && (
        <div style={{ marginTop: '3mm', fontSize: '8pt' }}>
          <b>Catatan:</b> {tx.notes}
        </div>
      )}

      {/* Tanda tangan: tiga kolom sama lebar, garis sejajar */}
      <div style={{ marginTop: 'auto', paddingTop: '8mm', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5mm', pageBreakInside: 'avoid' }}>
        {[
          ['Hormat Kami,', 'Kasir / Toko', settings?.showCashier !== false && tx.cashier?.name ? `( ${tx.cashier.name} )` : '( ............................ )'],
          ['Pengemudi / Armada,', 'Sopir Truk / Pikap', '( ............................ )'],
          ['Tanda Terima,', 'Mandor / Penerima Proyek', '( ............................ )'],
        ].map(([a, b, name], i) => (
          <div key={i} style={sig}>
            <div style={{ fontWeight: 700 }}>{a}</div>
            <div style={{ color: '#555', fontSize: '7pt' }}>{b}</div>
            <div style={{ height: '18mm' }} />
            <div style={{ borderTop: '0.3mm solid #000', paddingTop: '1mm', fontWeight: 700 }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
