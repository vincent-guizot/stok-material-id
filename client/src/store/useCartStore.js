import { create } from 'zustand';
import { calcTotals, roundRp, pickUnitPrice } from '../utils/calc.js';

// Harga satuan efektif: harga normal, atau harga grosir bertingkat bila qty memenuhi syarat (sama dengan server).
const resolvePrice = (sellPrice, wholesale, unitId, qty, on) => {
  const tiers = on ? (wholesale || []).filter((w) => w.unitId === unitId) : [];
  const { price, tier } = pickUnitPrice(parseFloat(sellPrice) || 0, tiers, qty);
  return { price, tier };
};

const priced = (item, on) => {
  const { price, tier } = resolvePrice(item.basePrice, item.wholesale, item.unitId, item.qty, on);
  return {
    ...item,
    unitPrice: price,
    tierLabel: tier ? tier.label : null,
    qtyBaseUnit: item.qty * item.conversionFactor,
    subtotal: roundRp(item.qty * price),
  };
};

export const useCartStore = create((set, get) => ({
  items: [],
  selectedCustomer: null,
  discount: 0,
  notes: '',
  wholesaleOn: true,

  setWholesaleOn: (on) => set((s) => ({ wholesaleOn: !!on, items: s.items.map((i) => priced(i, !!on)) })),

  addItem: (product, unit) => {
    const items = [...get().items];
    const on = get().wholesaleOn;
    const existingIndex = items.findIndex((item) => item.productId === product.id && item.unitId === unit.id);

    if (existingIndex > -1) {
      items[existingIndex] = priced({ ...items[existingIndex], qty: items[existingIndex].qty + 1 }, on);
    } else {
      const conversionFactor = parseFloat(unit.conversionFactor) || 1;
      items.push(
        priced(
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            baseUnit: product.baseUnit,
            currentStockBase: product.currentStockBase,
            unitId: unit.id,
            unitName: unit.unitName,
            conversionFactor,
            basePrice: parseFloat(unit.sellPrice) || 0,
            wholesale: product.wholesale || [],
            qty: 1,
            level: unit.level,
            availableUnits: product.units || [],
          },
          on,
        ),
      );
    }

    set({ items });
  },

  updateQty: (productId, unitId, newQty) => {
    const qty = parseFloat(newQty);
    if (isNaN(qty) || qty <= 0) {
      get().removeItem(productId, unitId);
      return;
    }
    const on = get().wholesaleOn;
    set({
      items: get().items.map((item) =>
        item.productId === productId && item.unitId === unitId ? priced({ ...item, qty }, on) : item,
      ),
    });
  },

  switchUnit: (productId, currentUnitId, targetUnit) => {
    const on = get().wholesaleOn;
    set({
      items: get().items.map((item) =>
        item.productId === productId && item.unitId === currentUnitId
          ? priced(
              {
                ...item,
                unitId: targetUnit.id,
                unitName: targetUnit.unitName,
                conversionFactor: parseFloat(targetUnit.conversionFactor) || 1,
                basePrice: parseFloat(targetUnit.sellPrice) || 0,
                level: targetUnit.level,
              },
              on,
            )
          : item,
      ),
    });
  },

  removeItem: (productId, unitId) => {
    set({ items: get().items.filter((item) => !(item.productId === productId && item.unitId === unitId)) });
  },

  setCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },

  setDiscount: (discount) => {
    set({ discount: Math.max(0, parseFloat(discount) || 0) });
  },

  setNotes: (notes) => {
    set({ notes });
  },

  clearCart: () => {
    set({ items: [], selectedCustomer: null, discount: 0, notes: '' });
  },

  // Semua angka uang dihitung lewat calcTotals (rumus sama dengan server).
  getTotals: (taxRate = 0) => {
    const { items, discount } = get();
    return calcTotals({
      items: items.map((i) => ({ qty: i.qty, unitPrice: i.unitPrice })),
      discountPercent: discount || 0,
      taxRate,
    });
  },

  getSubtotal: () => get().getTotals(0).subtotal,

  getTotal: (taxRate = 0) => get().getTotals(taxRate).total,

  getItemCount: () => {
    return get().items.reduce((count, item) => count + (item.qty || 0), 0);
  },
}));
