import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout.jsx';
import POSPage from './pages/POSPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import DebtLedgerPage from './pages/DebtLedgerPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import MasterDataPage from './pages/MasterDataPage.jsx';
import SupplierPage from './pages/SupplierPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import HelpCenterPage from './pages/HelpCenterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <POSPage />,
      },
      {
        path: 'pos',
        element: <POSPage />,
      },
      {
        path: 'checkout',
        element: <PaymentPage />,
      },
      {
        path: 'debts',
        element: <DebtLedgerPage />,
      },
      {
        path: 'mandor',
        element: <Navigate to="/debts" replace />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'master',
        element: <MasterDataPage />,
      },
      {
        path: 'suppliers',
        element: <SupplierPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'help',
        element: <HelpCenterPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
