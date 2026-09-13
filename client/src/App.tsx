import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Login } from './pages/Login.js';
import { WaiterView } from './pages/waiter/WaiterView.js';
import { KitchenDisplay } from './pages/kitchen/KitchenDisplay.js';
import { CashierView } from './pages/cashier/CashierView.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('waiter');

  // Ajustar vista inicial según el rol del usuario al ingresar
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin_general':
        case 'admin_local':
          setCurrentView('admin');
          break;
        case 'mozo':
          setCurrentView('waiter');
          break;
        case 'cocina':
          setCurrentView('kitchen');
          break;
        case 'cajero':
          setCurrentView('cashier');
          break;
      }
    }
  }, [user?.id, user?.role]);

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
      <Navbar currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1">
        {currentView === 'waiter' && <WaiterView />}
        {currentView === 'kitchen' && <KitchenDisplay />}
        {currentView === 'cashier' && <CashierView />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'menu-matrix' && <AdminDashboard />}
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
