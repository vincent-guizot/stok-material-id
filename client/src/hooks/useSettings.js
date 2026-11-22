import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';

// Pengaturan toko (nama, alamat, nota, tarif PPN). Kunci cache sama dengan SettingsPage
// sehingga perubahan di Pengaturan langsung terbaca di kasir, pembayaran, dan cetak nota.
export function useSettings() {
  const query = useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
    staleTime: 30 * 1000,
  });
  const settings = query.data || {};
  const taxRate = parseFloat(settings.taxRate) || 0;
  const allowMinusStock = String(settings.allowMinusStock || 'no').toLowerCase() === 'yes';
  return { ...query, settings, taxRate, allowMinusStock };
}
