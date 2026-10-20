import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  selectedCustomer: null,
  discount: 0,
  notes: '',

  addItem: (product, unit) => {
    const items = [...get().items];
    const existingIndex = items.findIndex(
      (item) => item.productId === product.id && item.unitId === unit.id
    );

    const unitPrice = parseFloat(unit.sellPrice) || 0;

    if (existingIndex > -1) {
      items[existingIndex].qty += 1;
      items[existingIndex].subtotal = items[existingIndex].qty * items[existingIndex].unitPrice;
      items[existingIndex].qtyBaseUnit = items[existingIndex].qty * items[existingIndex].conversionFactor;
    } else {
      const conversionFactor = parseFloat(unit.conversionFactor) || 1;
      items.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        baseUnit: product.baseUnit,
        currentStockBase: product.currentStockBase,
        unitId: unit.id,
        unitName: unit.unitName,
        conversionFactor,
        unitPrice,
        qty: 1,
        qtyBaseUnit: conversionFactor,
        subtotal: unitPrice,
        level: unit.level,
        availableUnits: product.units || [],
      });
    }

    set({ items });
  },

  updateQty: (productId, unitId, newQty) => {
    const qty = parseFloat(newQty);
    if (isNaN(qty) || qty <= 0) {
      get().removeItem(productId, unitId);
      return;
    }

    const items = get().items.map((item) => {
      if (item.productId === productId && item.unitId === unitId) {
        return {
          ...item,
          qty,
          qtyBaseUnit: qty * item.conversionFactor,
          subtotal: qty * item.unitPrice,
        };
      }
      return item;
    });

    set({ items });
  },

  switchUnit: (productId, currentUnitId, targetUnit) => {
    const items = get().items.map((item) => {
      if (item.productId === productId && item.unitId === currentUnitId) {
        const conversionFactor = parseFloat(targetUnit.conversionFactor) || 1;
        const unitPrice = parseFloat(targetUnit.sellPrice) || 0;
        return {
          ...item,
          unitId: targetUnit.id,
          unitName: targetUnit.unitName,
          conversionFactor,
          unitPrice,
          level: targetUnit.level,
          qtyBaseUnit: item.qty * conversionFactor,
          subtotal: item.qty * unitPrice,
        };
      }
      return item;
    });

    set({ items });
  },

  removeItem: (productId, unitId) => {
    const items = get().items.filter(
      (item) => !(item.productId === productId && item.unitId === unitId)
    );
    set({ items });
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

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount || 0;
    return Math.max(0, subtotal - discount);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + (item.qty || 0), 0);
  },
}));
