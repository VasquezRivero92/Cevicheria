import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Login } from './pages/Login.js';
import { WaiterView } from './pages/waiter/WaiterView.js';
import { KitchenDisplay } from './pages/kitchen/KitchenDisplay.js';
import { CashierView } from './pages/cashier/CashierView.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';

import { Role } from './types.js';

// Verificación estricta de permisos por rol
export const isAllowedView = (view: string, role?: Role): boolean => {
  if (!role) return false;
  switch (view) {
    case 'admin':
    case 'menu-matrix':
      return role === 'admin_general' || role === 'admin_local';
    case 'kitchen':
      return role === 'admin_general' || role === 'admin_local' || role === 'cocina';
    case 'cashier':
      return role === 'admin_general' || role === 'admin_local' || role === 'cajero';
    case 'waiter':
      return role === 'admin_general' || role === 'admin_local' || role === 'mozo';
    default:
      return false;
  }
};

export const getDefaultViewForRole = (role?: Role): string => {
  switch (role) {
    case 'admin_general':
    case 'admin_local':
      return 'admin';
    case 'mozo':
      return 'waiter';
    case 'cocina':
      return 'kitchen';
    case 'cajero':
      return 'cashier';
    default:
      return 'waiter';
  }
};

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>(() => getDefaultViewForRole(user?.role));

  // Ajustar vista inicial o forzar redirección si la vista actual no está permitida para su rol
  useEffect(() => {
    if (user) {
      if (!isAllowedView(currentView, user.role)) {
        setCurrentView(getDefaultViewForRole(user.role));
      }
    }
  }, [user?.id, user?.role, currentView]);

  const handleNavigate = (view: string) => {
    if (user && isAllowedView(view, user.role)) {
      setCurrentView(view);
    } else if (user) {
      console.warn(`[Seguridad] Acceso no autorizado a la vista '${view}' para el rol '${user.role}'`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fef8f1] flex items-center justify-center text-[#00223a] font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-[#133854] border-2 border-[#fc772a] shadow-lg animate-pulse">
            <img src="/images/logo_clean.png" alt="Logo" className="w-full h-full object-contain bg-white p-1" />
          </div>
          <div className="w-8 h-8 border-3 border-[#fc772a] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-['Epilogue',sans-serif] font-bold tracking-wider uppercase text-[#a04100]">Cargando La Barra Sabrosísimo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#fef8f1] text-[#1d1b17] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#ffdbcc] selection:text-[#351000]">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentView === 'waiter' && isAllowedView('waiter', user.role) && <WaiterView />}
        {currentView === 'kitchen' && isAllowedView('kitchen', user.role) && <KitchenDisplay />}
        {currentView === 'cashier' && isAllowedView('cashier', user.role) && <CashierView />}
        {currentView === 'admin' && isAllowedView('admin', user.role) && <AdminDashboard initialTab="overview" />}
        {currentView === 'menu-matrix' && isAllowedView('menu-matrix', user.role) && <AdminDashboard initialTab="matrix" />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
