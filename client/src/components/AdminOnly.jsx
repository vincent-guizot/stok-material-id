import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

// Halaman yang API-nya khusus admin: peran lain dialihkan ke Kasir.
export default function AdminOnly({ children }) {
  const role = useAuthStore((st) => st.user?.role);
  return role === 'admin' ? children : <Navigate to="/" replace />;
}
