import { create } from 'zustand';
import api from '../services/api.js';

const initialUser = (() => {
  try {
    const saved = localStorage.getItem('stokmaterial_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create((set) => ({
  user: initialUser,
  token: localStorage.getItem('stokmaterial_token') || null,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data.data;

      localStorage.setItem('stokmaterial_token', token);
      localStorage.setItem('stokmaterial_user', JSON.stringify(user));

      set({ token, user, isLoading: false });
      return { success: true };
    } catch (err) {
      let message = err.response?.data?.message;
      if (!message) {
        if (err.code === 'ERR_NETWORK' || !err.response) {
          message = 'Gagal terhubung ke Server API (Pastikan server backend di port 5000 sudah berjalan).';
        } else {
          message = 'Gagal masuk. Periksa username dan password Anda.';
        }
      }
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('stokmaterial_token');
    localStorage.removeItem('stokmaterial_user');
    set({ user: null, token: null });
  },

  quickDemoLogin: async (role) => {
    const creds = {
      admin: { u: 'admin', p: 'admin123' },
      cashier: { u: 'kasir', p: 'kasir123' },
      warehouse: { u: 'gudang', p: 'gudang123' },
    };
    const c = creds[role] || creds.cashier;
    return useAuthStore.getState().login(c.u, c.p);
  },
}));
