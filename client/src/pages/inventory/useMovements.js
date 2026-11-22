import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.js';

/** Riwayat mutasi stok dari server, difilter per jenis: 'OUT', 'TRANSFER', 'ADJUSTMENT', 'OPNAME', ... */
export function useMovements(types, extra = {}) {
  return useQuery({
    queryKey: ['movements', types, extra],
    queryFn: async () => (await api.get('/stocks/movements', { params: { type: types, limit: 200, ...extra } })).data.data,
  });
}

export const MOVEMENT_LABEL = {
  SALE: 'Penjualan',
  IN: 'Barang masuk',
  OUT: 'Barang keluar',
  TRANSFER: 'Mutasi lokasi',
  ADJUSTMENT: 'Penyesuaian',
  OPNAME: 'Opname',
  RETURN: 'Retur',
};

export const INVALIDATE_AFTER_STOCK = ['products', 'movements', 'reports', 'notifications'];
