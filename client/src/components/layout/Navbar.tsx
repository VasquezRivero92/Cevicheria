import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { 
  Fish, 
  MapPin, 
  Volume2, 
  VolumeX, 
  LogOut, 
  ChefHat, 
  Smartphone, 
  Receipt, 
  LayoutDashboard,
  Store
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, currentBranch, userBranches, setBranch, logout } = useAuth();
  const { isConnected, soundEnabled, toggleSound } = useSocket();

  if (!user) return null;

  const isAdmin = user.role === 'admin_general' || user.role === 'admin_local';
  const isGeneralAdmin = user.role === 'admin_general';

  const getRoleBadge = () => {
    switch (user.role) {
      case 'admin_general':
        return <span className="bg-[#133854] text-[#cee5ff] border border-[#274966] text-[10px] font-['Epilogue',sans-serif] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">👑 Admin General</span>;
      case 'admin_local':
        return <span className="bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] text-[10px] font-['Epilogue',sans-serif] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">🏢 Admin de Sede</span>;
      case 'mozo':
        return <span className="bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5] text-[10px] font-['Epilogue',sans-serif] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">📱 Mesero</span>;
      case 'cocina':
        return <span className="bg-[#fefce8] text-[#ca8a04] border border-[#fef08a] text-[10px] font-['Epilogue',sans-serif] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">👨‍🍳 Cocina / Barra</span>;
      case 'cajero':
        return <span className="bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] text-[10px] font-['Epilogue',sans-serif] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">💵 Caja</span>;
      default:
        return null;
    }
  };

  return (
    <header className="w-full max-w-full overflow-x-hidden bg-[#fef8f1]/95 backdrop-blur-md border-b border-[#133854]/10 sticky top-0 z-40 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px]">
          {/* Logo y Nombre Stitch Style (Responsive) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 py-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#133854] border-2 border-[#fc772a] shadow-sm shrink-0">
              <img 
                src="/images/logo_clean.png" 
                alt="Logo La Barra Sabrosísimo" 
                className="w-full h-full object-contain bg-white p-0.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Fish className="w-4 h-4 text-white hidden" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-['Epilogue',sans-serif] font-black text-sm sm:text-base text-[#00223a] tracking-tight truncate">
                  La Barra
                </span>
                <span className="text-[9px] sm:text-[10px] font-['Epilogue',sans-serif] font-extrabold uppercase tracking-wider bg-[#fc772a] text-white px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm shrink-0">
                  Sabrosísimo
                </span>
              </div>
              <div className="hidden xs:flex items-center gap-1.5 text-[9px] sm:text-[10px] font-['Epilogue',sans-serif] text-[#a04100] font-bold tracking-wider uppercase mt-0.5 whitespace-nowrap leading-none">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></span>
                <span>{isConnected ? 'En Vivo' : 'Offline'}</span>
                <span className="text-[#133854]/30">•</span>
                <span className="text-[#133854] truncate">La Mar nos une</span>
              </div>
            </div>
          </div>

          {/* Navegación por Vistas Estilo Stitch */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#f3ede6] p-1 rounded-full border border-[#133854]/10 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={() => onNavigate('admin')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentView === 'admin' 
                      ? 'bg-[#00223a] text-white shadow-sm font-[\'Epilogue\',sans-serif]' 
                      : 'text-[#42474d] hover:bg-[#ede7e0]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {isGeneralAdmin ? 'Admin Multilocal' : 'Admin Sede'}
                </button>
                <button
                  onClick={() => onNavigate('menu-matrix')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentView === 'menu-matrix' 
                      ? 'bg-[#00223a] text-white shadow-sm font-[\'Epilogue\',sans-serif]' 
                      : 'text-[#42474d] hover:bg-[#ede7e0]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Carta de Sede
                </button>
              </>
            )}

            {(isAdmin || user.role === 'mozo') && (
              <button
                onClick={() => onNavigate('waiter')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'waiter' 
                    ? 'bg-[#00223a] text-white shadow-sm font-[\'Epilogue\',sans-serif]' 
                    : 'text-[#42474d] hover:bg-[#ede7e0]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#fc772a]" />
                Comandero
              </button>
            )}

            {(isAdmin || user.role === 'cocina') && (
              <button
                onClick={() => onNavigate('kitchen')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'kitchen' 
                    ? 'bg-[#00223a] text-white shadow-sm font-[\'Epilogue\',sans-serif]' 
                    : 'text-[#42474d] hover:bg-[#ede7e0]'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 text-[#fc772a]" />
                Cocina KDS
              </button>
            )}

            {(isAdmin || user.role === 'cajero') && (
              <button
                onClick={() => onNavigate('cashier')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'cashier' 
                    ? 'bg-[#00223a] text-white shadow-sm font-[\'Epilogue\',sans-serif]' 
                    : 'text-[#42474d] hover:bg-[#ede7e0]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-[#fc772a]" />
                Caja
              </button>
            )}
          </nav>

          {/* Selector de Sede y Usuario Stitch Style */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Selector de Sede Activa */}
            <div className="flex items-center bg-[#f3ede6] hover:bg-[#ede7e0] border border-[#133854]/10 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 transition-colors">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#fc772a] mr-1 shrink-0" />
              {userBranches.length > 1 ? (
                <select
                  value={currentBranch?.id || ''}
                  onChange={(e) => {
                    const sel = userBranches.find((b) => b.id === e.target.value);
                    if (sel) setBranch(sel);
                  }}
                  className="bg-transparent text-[11px] sm:text-xs font-['Epilogue',sans-serif] font-bold text-[#00223a] border-none focus:outline-none cursor-pointer max-w-[80px] xs:max-w-[110px] sm:max-w-none truncate"
                >
                  {userBranches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#fef8f1] text-[#00223a]">
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px] sm:text-xs font-['Epilogue',sans-serif] font-bold text-[#00223a] max-w-[70px] xs:max-w-[100px] sm:max-w-[150px] truncate">
                  {currentBranch?.name || 'Sede'}
                </span>
              )}
            </div>

            {/* Sonido toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Silenciar timbres' : 'Activar timbres de cocina'}
              className="p-1.5 sm:p-2 text-[#42474d] hover:text-[#00223a] hover:bg-[#f3ede6] rounded-full transition-colors border border-transparent hover:border-[#133854]/10 shrink-0"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#fc772a]" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#73777e]" />}
            </button>

            {/* Perfil & Salir */}
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-[#133854]/15 pl-1.5 sm:pl-3 shrink-0">
              <div className="hidden sm:block text-right whitespace-nowrap">
                <p className="text-xs font-['Epilogue',sans-serif] font-bold text-[#00223a] leading-tight truncate max-w-[180px]">{user.name}</p>
                <div className="mt-0.5 flex justify-end">{getRoleBadge()}</div>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="p-1.5 sm:p-2 text-[#ba1a1a] hover:text-red-700 hover:bg-[#ffdad6]/60 rounded-full transition-colors shrink-0 flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra móvil inferior de navegación rápida para celulares */}
      <div className="md:hidden flex items-center justify-around border-t border-[#133854]/10 bg-[#fef8f1] py-1.5 px-2 text-xs">
        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              currentView === 'admin' ? 'text-[#00223a] font-bold bg-[#f3ede6]' : 'text-[#73777e]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#fc772a]" />
            <span className="text-[10px] mt-0.5">Admin</span>
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onNavigate('menu-matrix')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              currentView === 'menu-matrix' ? 'text-[#00223a] font-bold bg-[#f3ede6]' : 'text-[#73777e]'
            }`}
          >
            <Store className="w-4 h-4 text-[#fc772a]" />
            <span className="text-[10px] mt-0.5">Carta</span>
          </button>
        )}
        {(isAdmin || user.role === 'mozo') && (
          <button
            onClick={() => onNavigate('waiter')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              currentView === 'waiter' ? 'text-[#00223a] font-bold bg-[#f3ede6]' : 'text-[#73777e]'
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#fc772a]" />
            <span className="text-[10px] mt-0.5">Mesero</span>
          </button>
        )}
        {(isAdmin || user.role === 'cocina') && (
          <button
            onClick={() => onNavigate('kitchen')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              currentView === 'kitchen' ? 'text-[#00223a] font-bold bg-[#f3ede6]' : 'text-[#73777e]'
            }`}
          >
            <ChefHat className="w-4 h-4 text-[#fc772a]" />
            <span className="text-[10px] mt-0.5">Cocina</span>
          </button>
        )}
        {(isAdmin || user.role === 'cajero') && (
          <button
            onClick={() => onNavigate('cashier')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              currentView === 'cashier' ? 'text-[#00223a] font-bold bg-[#f3ede6]' : 'text-[#73777e]'
            }`}
          >
            <Receipt className="w-4 h-4 text-[#fc772a]" />
            <span className="text-[10px] mt-0.5">Caja</span>
          </button>
        )}
        <button
          onClick={logout}
          className="flex flex-col items-center py-1 px-2.5 rounded-xl transition-all text-[#ba1a1a] hover:bg-[#ffdad6]/50 active:scale-95"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 text-[#ba1a1a]" />
          <span className="text-[10px] mt-0.5 font-bold">Salir</span>
        </button>
      </div>
    </header>
  );
};
