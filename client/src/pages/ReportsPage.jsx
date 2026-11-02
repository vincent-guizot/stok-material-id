import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api.js";
import { formatRupiah, formatDateIndo } from "../utils/formatters.js";
import { exportToCsv } from "../utils/exportCsv.js";
import { BarChart3, Download } from "lucide-react";

export default function ReportsPage() {
  const [tab, setTab] = useState("summary");
  const summary = useQuery({
    queryKey: ["dashboard_summary"],
    queryFn: async () => (await api.get("/reports/summary")).data.data,
  });
  const sales = useQuery({
    queryKey: ["report_transactions"],
    queryFn: async () =>
      (await api.get("/transactions", { params: { limit: 1000 } })).data.data,
  });
  const customers = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await api.get("/customers")).data.data,
  });
  const products = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data.data,
  });
  const queries = [summary, sales, customers, products];
  if (queries.some((q) => q.isPending))
    return (
      <div className="p-6" role="status">
        Memuat laporan…
      </div>
    );
  if (queries.some((q) => q.isError))
    return (
      <div className="p-6" role="alert">
        Gagal memuat laporan.{" "}
        <button onClick={() => queries.forEach((q) => q.refetch())}>
          Coba lagi
        </button>
      </div>
    );
  const stats = summary.data;
  const stockValue = (product) => {
    const base = product.units?.find(
      (u) => u.isBase || Number(u.conversionFactor) === 1,
    );
    return base
      ? Number(base.buyPrice) * Number(product.currentStockBase)
      : null;
  };
  const tables = {
    sales: {
      headers: [
        "Tanggal",
        "Nota",
        "Pelanggan",
        "Kasir",
        "Subtotal",
        "Diskon",
        "Total",
        "Status",
      ],
      rows: sales.data.map((t) => [
        formatDateIndo(t.transactionDate),
        t.invoiceNumber,
        t.customer?.name || "Pembeli Umum",
        t.cashier?.name || "—",
        formatRupiah(t.subtotal),
        formatRupiah(t.discount),
        formatRupiah(t.totalAmount),
        t.paymentStatus,
      ]),
    },
    debts: {
      headers: ["Mandor", "Telepon", "Limit", "Piutang", "Sisa Kredit"],
      rows: customers.data.map((c) => [
        c.name,
        c.phone || "—",
        Number(c.creditLimit) > 0 ? formatRupiah(c.creditLimit) : "Tanpa limit",
        formatRupiah(c.currentDebt),
        Number(c.creditLimit) > 0
          ? formatRupiah(c.remainingCredit)
          : "Tanpa limit",
      ]),
    },
    stocks: {
      headers: [
        "SKU",
        "Material",
        "Stok",
        "Satuan",
        "Nilai berdasarkan harga beli saat ini",
      ],
      rows: products.data.map((p) => [
        p.sku,
        p.name,
        p.currentStockBase,
        p.baseUnit,
        stockValue(p) === null
          ? "Harga dasar belum tersedia"
          : formatRupiah(stockValue(p)),
      ]),
    },
  };
  const table = tables[tab];
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#234536] flex gap-2 items-center">
            <BarChart3 />
            Laporan Keuangan
          </h1>
          <p className="text-sm text-[#625D53]">
            Data tersimpan di database · Ringkasan seluruh periode
          </p>
        </div>
        {table && (
          <button
            className="bg-[#234536] text-white p-3 rounded-lg flex gap-2"
            onClick={() =>
              exportToCsv(`laporan-${tab}`, table.headers, table.rows)
            }
          >
            <Download size={18} />
            Export CSV
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ["Total Penjualan", formatRupiah(stats.totalRevenue)],
          ["Penerimaan Pembayaran", formatRupiah(stats.totalCashReceived)],
          ["Piutang Berjalan", formatRupiah(stats.totalOutstandingDebt)],
          ["Jumlah Transaksi", stats.transactionCount],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-white border border-[#DEDCCF] rounded-xl p-5"
          >
            <div className="text-sm text-[#625D53]">{label}</div>
            <div className="text-xl font-extrabold text-[#234536] mt-2">
              {value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          ["summary", "Ringkasan"],
          ["sales", "Penjualan"],
          ["debts", "Piutang Mandor"],
          ["stocks", "Stok Barang"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg border ${tab === id ? "bg-[#234536] text-white" : "bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "summary" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-bold mb-3">Material Terlaris</h2>
            {stats.topItems.length ? (
              stats.topItems.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-4 py-2 border-b"
                >
                  <span>
                    {p.productName} · {Number(p.totalSoldQty)} {p.unitName}
                  </span>
                  <strong>{formatRupiah(p.totalGrossSales)}</strong>
                </div>
              ))
            ) : (
              <p>Belum ada penjualan.</p>
            )}
          </div>
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-bold mb-3">
              Stok Menipis ({stats.lowStockCount})
            </h2>
            {stats.lowStockProducts.length ? (
              stats.lowStockProducts.map((p) => (
                <div key={p.id} className="flex justify-between py-2 border-b">
                  <span>{p.name}</span>
                  <strong>
                    {p.currentStockBase} {p.baseUnit}
                  </strong>
                </div>
              ))
            ) : (
              <p>Tidak ada stok menipis.</p>
            )}
          </div>
        </div>
      )}
      {table && (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F7F4ED]">
              <tr>
                {table.headers.map((h) => (
                  <th className="p-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.length ? (
                table.rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    {row.map((cell, j) => (
                      <td className="p-3" key={j}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-4" colSpan={table.headers.length}>
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {tab === "sales" && (
        <p className="text-xs text-[#625D53]">
          Menampilkan maksimal 1.000 transaksi terbaru. Ringkasan mencakup
          seluruh transaksi.
        </p>
      )}
      <p className="text-xs text-[#625D53]">
        Laporan pembelian, laba rugi, dan arus kas lengkap belum tersedia karena
        pencatatan pembelian dan biaya operasional belum diimplementasikan.
      </p>
    </div>
  );
}
