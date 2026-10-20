import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api.js";
import { useCartStore } from "../store/useCartStore.js";
import { formatRupiah } from "../utils/formatters.js";
import MaterialImage from "../components/MaterialImage.jsx";
import CreditHealthBar from "../components/CreditHealthBar.jsx";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  User,
  LayoutGrid,
  List,
  ArrowRight,
  X,
} from "lucide-react";

export default function POSPage({ onProceedToPayment, globalSearch }) {
  const navigate = useNavigate();
  const outlet = useOutletContext() || {};
  const effectiveGlobalSearch =
    globalSearch !== undefined ? globalSearch : outlet.globalSearch;
  const handleProceed = useCallback(() => {
    if (onProceedToPayment) {
      onProceedToPayment();
    } else {
      navigate("/checkout");
    }
  }, [onProceedToPayment, navigate]);

  const [localSearch, setLocalSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const {
    items,
    selectedCustomer,
    discount,
    addItem,
    updateQty,
    removeItem,
    setCustomer,
    setDiscount,
    clearCart,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  const searchQuery = effectiveGlobalSearch || localSearch;

  // 1. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data;
    },
  });

  // 2. Fetch Products
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["products", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory;
      const res = await api.get("/products", { params });
      return res.data.data;
    },
  });

  // 3. Fetch Customers for Customer selector
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get("/customers");
      return res.data.data;
    },
  });

  // Keyboard shortcut F10 -> Lanjut ke pembayaran
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "F10" || e.key === "F2") && items.length > 0) {
        e.preventDefault();
        handleProceed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length, handleProceed]);

  const subtotal = getSubtotal();
  const discountAmount = Math.round(subtotal * (discount / 100));
  const taxAmount = Math.round((subtotal - discountAmount) * 0.11);
  const total = subtotal - discountAmount + taxAmount;

  // Filtered & sorted products
  const displayProducts = [...products]
    .filter((prod) => {
      if (selectedBrand === "all") return true;
      const name = (prod.name || "").toLowerCase();
      const sku = (prod.sku || "").toLowerCase();
      if (selectedBrand === "indocement") {
        return (
          name.includes("tiga roda") ||
          name.includes("indocement") ||
          sku.includes("tgr")
        );
      }
      if (selectedBrand === "semen-gresik") {
        return name.includes("gresik") || sku.includes("grs");
      }
      if (selectedBrand === "rucika") {
        return (
          name.includes("rucika") ||
          name.includes("wavin") ||
          sku.includes("wvn")
        );
      }
      if (selectedBrand === "dulux") {
        return (
          name.includes("dulux") ||
          name.includes("catylac") ||
          sku.includes("dlx")
        );
      }
      if (selectedBrand === "hebel") {
        return name.includes("hebel") || sku.includes("hbl");
      }
      if (selectedBrand === "sni") {
        return name.includes("sni") || sku.includes("bsi");
      }
      return (
        name.includes(selectedBrand.toLowerCase()) ||
        sku.includes(selectedBrand.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        const priceA = a.units?.[0]?.sellPrice || 0;
        const priceB = b.units?.[0]?.sellPrice || 0;
        return priceA - priceB;
      }
      if (sortBy === "price-high") {
        const priceA = a.units?.[0]?.sellPrice || 0;
        const priceB = b.units?.[0]?.sellPrice || 0;
        return priceB - priceA;
      }
      return 0; // Default popular / order from server
    });

  // Reusable Cart Content renderer for both desktop column & mobile bottom sheet
  const renderCartContent = (isMobile = false) => (
    <div className="flex flex-col h-full w-full bg-white select-none">
      {/* Cart Header */}
      <div className="p-4 border-b border-[#DEDCCF] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#234536]" />
          <h2 className="font-extrabold text-sm text-[#252922]">
            Keranjang Belanja
          </h2>
          <span className="w-5 h-5 rounded-full bg-[#234536] text-white text-xs font-bold flex items-center justify-center">
            {items.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs font-bold text-[#C62828] hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}

          {isMobile && (
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="p-1 text-[#8C877D] hover:text-[#252922] rounded transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-[#8C877D] space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#F7F4ED] flex items-center justify-center text-xl">
              🛒
            </div>
            <div className="text-xs font-bold text-[#252922]">
              Keranjang Masih Kosong
            </div>
            <div className="text-[11px] text-[#625D53] max-w-xs">
              Klik tombol{" "}
              <span className="font-bold text-[#234536]">+ Tambah</span> pada
              katalog material untuk memasukkan barang.
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.productId}-${item.unitId}`}
              className="p-2.5 rounded-card bg-[#F7F4ED]/50 border border-[#DEDCCF] flex items-center justify-between gap-2.5 hover:bg-[#F7F4ED] transition"
            >
              {/* Thumb + Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <MaterialImage
                  name={item.productName}
                  sku={item.sku}
                  className="w-10 h-10 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-extrabold text-xs text-[#252922] truncate">
                    {item.productName}
                  </div>
                  <div className="text-[10px] text-[#8C877D] font-mono truncate">
                    {item.sku}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-[#DEDCCF] text-[10px] font-bold text-[#252922]">
                      {item.unitName}
                    </span>
                    <span className="text-xs font-bold text-[#252922]">
                      {formatRupiah(item.unitPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qty Steppers & Subtotal */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      updateQty(item.productId, item.unitId, item.qty - 1)
                    }
                    className="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-[#DEDCCF] flex items-center justify-center text-[#252922] font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-black text-xs text-[#252922]">
                    {item.qty}
                  </span>
                  <button
                    onClick={() =>
                      updateQty(item.productId, item.unitId, item.qty + 1)
                    }
                    className="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-[#DEDCCF] flex items-center justify-center text-[#252922] font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => removeItem(item.productId, item.unitId)}
                    className="p-1 text-[#C62828] hover:bg-red-50 rounded transition ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-extrabold text-[#234536]">
                  {formatRupiah(item.subtotal)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer / Project Selector */}
      <div className="p-4 border-t border-[#DEDCCF] bg-[#F7F4ED]/60 space-y-2">
        <label className="text-[11px] font-bold text-[#625D53] flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-[#234536]" />
          <span>Pelanggan / Proyek (Opsional)</span>
        </label>

        <div className="flex gap-2">
          <select
            value={selectedCustomer?.id || ""}
            onChange={(e) => {
              const c = customers.find(
                (cust) => cust.id === parseInt(e.target.value, 10),
              );
              setCustomer(c || null);
            }}
            className="flex-1 p-2 bg-white border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
          >
            <option value="">Pembeli Umum (Cash / Langsung)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCustomer && <CreditHealthBar customer={selectedCustomer} />}
      </div>

      {/* Calculation Summary & Payment CTA */}
      <div className="p-4 border-t border-[#DEDCCF] bg-white space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-[#625D53]">
            <span>Total Item</span>
            <span className="font-bold text-[#252922]">
              {items.length} Jenis ({getItemCount()} Pcs)
            </span>
          </div>

          <div className="flex justify-between text-[#625D53]">
            <span>Subtotal</span>
            <span className="font-bold text-[#252922]">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#625D53]">
            <span>Diskon</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-12 text-center py-0.5 px-1 bg-[#F7F4ED] border border-[#DEDCCF] rounded text-xs font-bold text-[#252922]"
              />
              <span className="font-bold text-xs">%</span>
              <span className="font-bold text-[#C62828] ml-2">
                - {formatRupiah(discountAmount)}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-[#625D53]">
            <span>Pajak (PPN 11%)</span>
            <span className="font-bold text-[#252922]">
              {formatRupiah(taxAmount)}
            </span>
          </div>

          <div className="pt-2 border-t border-[#DEDCCF] flex items-baseline justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#252922]">
              TOTAL BELANJA
            </span>
            <span className="text-2xl font-black text-[#234536] tracking-tight">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        {/* CTA: Lanjut ke Pembayaran (F2) */}
        <button
          onClick={() => {
            if (isMobile) setIsMobileCartOpen(false);
            handleProceed();
          }}
          disabled={items.length === 0}
          className="w-full py-3.5 px-4 rounded-control bg-[#234536] hover:bg-[#1c372b] active:scale-[0.99] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CreditCard className="w-4 h-4" />
          <span>Lanjut ke Pembayaran (F10)</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col lg:flex-row h-full w-full overflow-hidden bg-[#F7F4ED]">
      {/* ============================================================ */}
      {/* MAIN COLUMN: KATALOG & GRID PRODUK (Full width on mobile/tab) */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header Title & Category Filter */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#DEDCCF] space-y-3 sm:space-y-4 shrink-0">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">
                Kasir Penjualan
              </h1>
              <p className="text-xs text-[#625D53]">
                Pilih barang material, tambahkan ke keranjang, lalu lanjut ke
                pembayaran.
              </p>
            </div>
          </div>

          {/* Horizontal Category Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-control text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === null
                  ? "bg-[#234536] text-white shadow-xs"
                  : "bg-[#F7F4ED] hover:bg-[#ECEAE2] text-[#252922] border border-[#DEDCCF]"
              }`}
            >
              <span>🛒</span>
              <span>Semua</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(isSelected ? null : cat.id)
                  }
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-control text-xs font-bold whitespace-nowrap transition ${
                    isSelected
                      ? "bg-[#234536] text-white shadow-xs"
                      : "bg-[#F7F4ED] hover:bg-[#ECEAE2] text-[#252922] border border-[#DEDCCF]"
                  }`}
                >
                  <span>{cat.icon || "🧱"}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search, Brand, Sort, View Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-[#8C877D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari produk di kasir..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-semibold text-[#252922] focus:outline-none focus:border-[#234536] focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
              >
                <option value="all">Semua Merek</option>
                <option value="indocement">Tiga Roda / Indocement</option>
                <option value="semen-gresik">Semen Gresik</option>
                <option value="rucika">Rucika / Wavin</option>
                <option value="dulux">Dulux / Catylac</option>
                <option value="hebel">Bata Hebel</option>
                <option value="sni">Besi SNI</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] focus:outline-none focus:border-[#234536]"
              >
                <option value="popular">Urutkan: Terlaris</option>
                <option value="price-low">Harga: Rendah ke Tinggi</option>
                <option value="price-high">Harga: Tinggi ke Rendah</option>
              </select>

              <div className="flex items-center border border-[#DEDCCF] rounded-control overflow-hidden bg-[#F7F4ED]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 ${viewMode === "grid" ? "bg-[#234536] text-white" : "text-[#625D53] hover:text-[#252922]"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 ${viewMode === "list" ? "bg-[#234536] text-white" : "text-[#625D53] hover:text-[#252922]"}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Catalog Grid - Responsive and fully visible */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-24 lg:pb-5">
          {isProductsLoading ? (
            <div className="flex items-center justify-center h-64 text-xs font-bold text-[#625D53]">
              Memuat katalog material konstruksi...
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-card border border-[#DEDCCF] p-6 max-w-sm mx-auto">
              <div className="text-3xl mb-2">🔍</div>
              <div className="font-bold text-sm text-[#252922]">
                Barang Tidak Ditemukan
              </div>
              <div className="text-xs text-[#625D53] mt-1">
                Tidak ada produk dengan kata kunci "{searchQuery}".
              </div>
            </div>
          ) : viewMode === "list" ? (
            /* Table View Mode */
            <div className="bg-white rounded-card border border-[#DEDCCF] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F7F4ED] border-b border-[#DEDCCF] text-[#8C877D] font-bold">
                    <tr>
                      <th className="py-3 px-3.5">PRODUK & SKU</th>
                      <th className="py-3 px-3">KATEGORI</th>
                      <th className="py-3 px-3 text-center">STOK</th>
                      <th className="py-3 px-3 text-right">HARGA / SATUAN</th>
                      <th className="py-3 px-3">OPSI SATUAN</th>
                      <th className="py-3 px-3 text-center w-36">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEDCCF]/70">
                    {displayProducts.map((prod) => {
                      const units = prod.units || [];
                      const selectedUnit =
                        units[units.length - 1] ||
                        units[0] || {
                          id: 1,
                          unitName: prod.baseUnit || "Pcs",
                          sellPrice: 0,
                          conversionFactor: 1,
                        };
                      const isOutOfStock = prod.currentStockBase <= 0;
                      const isLow = prod.currentStockBase <= (prod.minStock || 20);
                      const cartItem = items.find(
                        (i) =>
                          i.productId === prod.id && i.unitId === selectedUnit.id,
                      );

                      return (
                        <tr
                          key={prod.id}
                          className="hover:bg-[#F7F4ED]/50 transition group cursor-pointer"
                          onClick={() => {
                            if (!isOutOfStock) addItem(prod, selectedUnit);
                          }}
                        >
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <MaterialImage
                                name={prod.name}
                                sku={prod.sku}
                                className="w-10 h-10 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-extrabold text-xs text-[#252922] truncate">
                                  {prod.name}
                                </div>
                                <div className="text-[10px] text-[#8C877D] font-mono">
                                  {prod.sku}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#625D53]">
                            {prod.category?.name || "Material Bangunan"}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black">
                            <span
                              className={
                                isOutOfStock
                                  ? "text-[#C62828]"
                                  : isLow
                                  ? "text-[#D97706]"
                                  : "text-[#16845B]"
                              }
                            >
                              {prod.humanReadableStock ||
                                `${prod.currentStockBase} ${prod.baseUnit}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="font-black text-[#252922]">
                              {formatRupiah(selectedUnit.sellPrice)}
                            </div>
                            <span className="text-[10px] text-[#8C877D]">
                              per {selectedUnit.unitName}
                            </span>
                          </td>
                          <td
                            className="py-2.5 px-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {units.length > 1 ? (
                              <div className="flex flex-wrap gap-1">
                                {units.map((u) => (
                                  <button
                                    key={u.id}
                                    onClick={() => addItem(prod, u)}
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold text-[#16845B] transition"
                                    title={`Beli 1 ${u.unitName} (${formatRupiah(u.sellPrice)})`}
                                  >
                                    + {u.unitName}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#8C877D]">-</span>
                            )}
                          </td>
                          <td
                            className="py-2.5 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => addItem(prod, selectedUnit)}
                              disabled={isOutOfStock}
                              className="w-full py-1.5 px-2.5 rounded-control bg-[#234536] hover:bg-[#1c372b] active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>
                                {cartItem ? `+ Lagi (${cartItem.qty})` : "Tambah"}
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View Mode */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
              {displayProducts.map((prod) => {
                const units = prod.units || [];
                const selectedUnit = units[units.length - 1] ||
                  units[0] || {
                    id: 1,
                    unitName: prod.baseUnit || "Pcs",
                    sellPrice: 0,
                    conversionFactor: 1,
                  };

                const isPopular =
                  prod.id <= 5 ||
                  prod.name.includes("Semen") ||
                  prod.name.includes("Hebel");
                const isOutOfStock = prod.currentStockBase <= 0;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-card border border-[#DEDCCF] p-3.5 flex flex-col justify-between shadow-card hover:border-[#234536] hover:shadow-card-hover transition relative group"
                  >
                    {/* Top Terlaris Pill */}
                    {isPopular && (
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C6A46A]/20 border border-[#C6A46A]/40 text-[#92400E] text-[10px] font-extrabold">
                        <span>⭐</span>
                        <span>Terlaris</span>
                      </div>
                    )}

                    {/* Product Image / Illustration */}
                    <div className="w-full h-28 sm:h-32 flex items-center justify-center p-2">
                      <MaterialImage
                        name={prod.name}
                        sku={prod.sku}
                        className="w-full h-full max-h-24 sm:max-h-28"
                      />
                    </div>

                    {/* Info */}
                    <div className="mt-2 space-y-1">
                      <h3 className="font-extrabold text-xs text-[#252922] line-clamp-2 leading-tight">
                        {prod.name}
                      </h3>
                      <div className="text-[10px] text-[#8C877D] font-mono">
                        {prod.sku}
                      </div>

                      {/* Stock in Green */}
                      <div className="text-[11px] font-extrabold text-[#16845B]">
                        {isOutOfStock ? (
                          <span className="text-[#C62828]">Stok Habis</span>
                        ) : (
                          <span>
                            Stok:{" "}
                            {prod.humanReadableStock ||
                              `${prod.currentStockBase} ${prod.baseUnit}`}
                          </span>
                        )}
                      </div>

                      {/* Price & Unit selection */}
                      <div className="pt-2 flex items-baseline justify-between gap-1">
                        <div className="text-base font-black text-[#252922] tracking-tight">
                          {formatRupiah(selectedUnit.sellPrice)}
                        </div>

                        <span className="px-2 py-0.5 rounded bg-[#F7F4ED] border border-[#DEDCCF] text-[11px] font-bold text-[#625D53]">
                          {selectedUnit.unitName}
                        </span>
                      </div>

                      {/* Multi-unit alternative chips if product has > 1 unit */}
                      {units.length > 1 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {units.map((u) => (
                            <button
                              key={u.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem(prod, u);
                              }}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold text-[#16845B] transition"
                              title={`Beli 1 ${u.unitName} (${formatRupiah(u.sellPrice)})`}
                            >
                              + {u.unitName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addItem(prod, selectedUnit)}
                      disabled={isOutOfStock}
                      className="mt-3 w-full py-2 px-3 rounded-control bg-[#234536] hover:bg-[#1c372b] active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* DESKTOP RIGHT COLUMN: KERANJANG BELANJA (Visible on lg+)     */}
      {/* ============================================================ */}
      <div className="hidden lg:flex flex-col w-[380px] xl:w-[420px] 2xl:w-[440px] border-l border-[#DEDCCF] h-full shrink-0 bg-white">
        {renderCartContent(false)}
      </div>

      {/* ============================================================ */}
      {/* MOBILE / TABLET FLOATING FIXED CART BUTTON (Fixed kanan bawah)*/}
      {/* ============================================================ */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 lg:hidden">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#234536] hover:bg-[#1c372b] text-white shadow-modal border-2 border-[#C6A46A]/80 transition-all active:scale-95 group"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-white" />
            {items.length > 0 && (
              <span className="absolute -top-2.5 -right-2.5 px-1.5 py-0.2 bg-[#C62828] text-white text-[10px] font-black rounded-full flex items-center justify-center min-w-[20px] h-[20px] border-2 border-white shadow-xs">
                {items.length}
              </span>
            )}
          </div>
          <div className="text-left">
            <div className="text-[10px] text-white/80 font-bold uppercase tracking-wider leading-none">
              {items.length > 0
                ? `${items.length} Item di Keranjang`
                : "Keranjang Belanja"}
            </div>
            <div className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
              {formatRupiah(total)}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#C6A46A] group-hover:translate-x-1 transition-transform ml-1" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* MOBILE / TABLET CART DRAWER MODAL                            */}
      {/* ============================================================ */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative w-full max-h-[88vh] sm:max-w-md sm:right-0 sm:left-auto sm:top-0 sm:max-h-full sm:h-full bg-white rounded-t-2xl sm:rounded-none z-10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {renderCartContent(true)}
          </div>
        </div>
      )}
    </div>
  );
}
