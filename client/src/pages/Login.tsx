import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { KeyRound, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithUsername, loginWithPin } = useAuth();
  const [activeTab, setActiveTab] = useState<'pin' | 'user'>('pin');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        submitPin(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const submitPin = async (pinValue: string) => {
    setError('');
    setLoading(true);
    const success = await loginWithPin(pinValue);
    setLoading(false);
    if (!success) {
      setError('PIN incorrecto. Intenta nuevamente.');
      setPin('');
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError('');
    setLoading(true);
    const success = await loginWithUsername(username.trim());
    setLoading(false);
    if (!success) {
      setError('Usuario no encontrado o inactivo.');
    }
  };

  // Acceso de prueba con un solo clic
  const handleQuickDemo = async (quickUsername: string) => {
    setError('');
    setLoading(true);
    await loginWithUsername(quickUsername);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden flex flex-col justify-center items-center p-3 sm:p-6 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Fondo con el Patrón Marino Oficial en Alta Definición */}
      <div 
        className="absolute inset-0 bg-repeat bg-center"
        style={{ 
          backgroundImage: "url('/images/marine_pattern.jpg')", 
          backgroundSize: '340px'
        }}
      />

      {/* Capa de atmósfera marina con tinte Deep Ocean para contraste y elegancia */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06182c]/65 via-[#0a2540]/75 to-[#041120]/85 backdrop-blur-[1.5px]" />

      {/* Resplandores Costeros Suaves para iluminación de la tarjeta */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#29b6f6]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#fc772a]/20 blur-3xl pointer-events-none" />

      {/* Tarjeta de Login Náutica Stitch */}
      <div className="relative z-10 w-full max-w-md bg-[#0a1d37]/95 backdrop-blur-md text-white border-2 border-[#fc772a]/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 my-6">
        {/* Cabecera de Marca */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto rounded-full p-1 bg-white border-2 border-[#fc772a] shadow-xl shadow-[#fc772a]/30 mb-3 overflow-hidden flex items-center justify-center">
            <img 
              src="/images/logo_clean.png" 
              alt="Logo Cevichería La Barra Sabrosísimo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-['Epilogue',sans-serif] font-black tracking-tight text-white">
              La Barra
            </h1>
            <span className="text-[11px] font-['Epilogue',sans-serif] font-black uppercase bg-[#fc772a] text-white px-2.5 py-0.5 rounded-full shadow-sm">
              Sabrosísimo
            </span>
          </div>
          <p className="text-[11px] font-['Epilogue',sans-serif] font-bold tracking-widest text-[#ffdbcc] uppercase mt-1">
            Cevichería & Puerto Marino
          </p>
          <p className="text-[#80a2c2] text-xs mt-0.5">
            Sistema Multilocal de Atención y Comandas
          </p>
        </div>

        {/* Pestañas de modo de acceso */}
        <div className="flex bg-[#00223a]/80 p-1 rounded-2xl mb-6 border border-[#274966]">
          <button
            type="button"
            onClick={() => { setActiveTab('pin'); setError(''); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-['Epilogue',sans-serif] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pin' ? 'bg-[#fc772a] text-white shadow-md' : 'text-[#80a2c2] hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            PIN Rápido
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('user'); setError(''); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-['Epilogue',sans-serif] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'user' ? 'bg-[#fc772a] text-white shadow-md' : 'text-[#80a2c2] hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Usuario
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/40 text-red-200 text-xs rounded-2xl text-center font-medium">
            {error}
          </div>
        )}

        {/* Vista PIN */}
        {activeTab === 'pin' && (
          <div className="flex flex-col items-center">
            <p className="text-xs text-[#80a2c2] mb-4 font-medium">Ingresa tu código PIN de 4 dígitos:</p>
            {/* Visualizador de dígitos */}
            <div className="flex gap-4 mb-6">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pin.length > idx 
                      ? 'bg-[#fc772a] border-[#fc772a] scale-110 shadow-lg shadow-[#fc772a]/50' 
                      : 'border-[#80a2c2]/40'
                  }`}
                />
              ))}
            </div>

            {/* Teclado numérico táctil */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={loading}
                  onClick={() => handlePinDigit(num)}
                  className="h-13 py-3 bg-[#00223a] hover:bg-[#1a4b70] active:scale-95 rounded-2xl text-xl font-['Epilogue',sans-serif] font-bold transition-all flex items-center justify-center border border-[#274966] text-white shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handlePinDelete}
                className="h-13 py-3 bg-[#00223a]/60 hover:bg-rose-950/40 active:scale-95 rounded-2xl text-xs font-bold transition-all flex items-center justify-center text-rose-300 border border-[#274966]/60"
              >
                Borrar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePinDigit('0')}
                className="h-13 py-3 bg-[#00223a] hover:bg-[#1a4b70] active:scale-95 rounded-2xl text-xl font-['Epilogue',sans-serif] font-bold transition-all flex items-center justify-center border border-[#274966] text-white shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                disabled={loading || pin.length < 4}
                onClick={() => submitPin(pin)}
                className={`h-13 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center border ${
                  pin.length === 4
                    ? 'bg-[#fc772a] hover:bg-[#e05e16] text-white shadow-lg shadow-[#fc772a]/40 border-[#fc772a] active:scale-95'
                    : 'bg-[#00223a]/30 text-[#80a2c2]/30 border-[#274966]/40 cursor-not-allowed'
                }`}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Vista Usuario */}
        {activeTab === 'user' && (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#cee5ff] mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. admin, mozo.mira, cocina.mira"
                className="w-full bg-[#00223a] border border-[#274966] rounded-2xl px-4 py-3 text-white placeholder-[#80a2c2]/50 focus:outline-none focus:ring-2 focus:ring-[#fc772a]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#fc772a] hover:bg-[#e05e16] text-white font-['Epilogue',sans-serif] font-bold py-3.5 rounded-2xl shadow-lg shadow-[#fc772a]/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Accesos rápidos de demostración */}
        <div className="mt-7 pt-5 border-t border-[#274966]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#cee5ff] mb-3">
            <ShieldCheck className="w-4 h-4 text-[#fc772a]" />
            <span>Accesos rápidos de prueba por rol:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="col-span-2 p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all flex items-center justify-between"
            >
              <div>
                <span className="font-['Epilogue',sans-serif] font-bold text-white block">👑 Administrador General</span>
                <span className="text-[10px] text-[#80a2c2]">Control Multilocal total de todas las sedes (PIN 1234)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#fc772a] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin.principal')}
              className="p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all"
            >
              <span className="font-['Epilogue',sans-serif] font-bold text-[#cee5ff] block">🏢 Admin Sede Principal</span>
              <span className="text-[10px] text-[#80a2c2]">Carta y ventas local (PIN 1001)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin.sur')}
              className="p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all"
            >
              <span className="font-['Epilogue',sans-serif] font-bold text-[#cee5ff] block">🏢 Admin Sede Sur</span>
              <span className="text-[10px] text-[#80a2c2]">Carta y ventas local (PIN 2002)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin.multisede')}
              className="col-span-2 p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all flex items-center justify-between"
            >
              <div>
                <span className="font-['Epilogue',sans-serif] font-bold text-[#ffdbcc] block">🏢 Administrador Multisede (Principal + Sur)</span>
                <span className="text-[10px] text-[#80a2c2]">Gestiona 2 locales asignados (PIN 1002)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#fc772a] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('mozo.rotativo')}
              className="col-span-2 p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all flex items-center justify-between"
            >
              <div>
                <span className="font-['Epilogue',sans-serif] font-bold text-[#ffdbcc] block">📱 Mesero Rotativo (Principal y Sur)</span>
                <span className="text-[10px] text-[#80a2c2]">Puede alternar su comandero entre las 2 sedes (PIN 1122)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#fc772a] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('mozo.principal')}
              className="p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all"
            >
              <span className="font-['Epilogue',sans-serif] font-bold text-white block">📱 Mesero Principal</span>
              <span className="text-[10px] text-[#80a2c2]">PIN 1111</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('mozo.sur')}
              className="p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all"
            >
              <span className="font-['Epilogue',sans-serif] font-bold text-white block">📱 Mesera Sur</span>
              <span className="text-[10px] text-[#80a2c2]">PIN 2222</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('cocina.principal')}
              className="p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all"
            >
              <span className="font-['Epilogue',sans-serif] font-bold text-amber-300 block">👨‍🍳 Cocina / Barra</span>
              <span className="text-[10px] text-[#80a2c2]">KDS en vivo (PIN 3333)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('caja.principal')}
              className="p-2.5 bg-[#00223a] hover:bg-[#1a4b70] border border-[#274966] rounded-2xl text-left transition-all"
            >
              <span className="font-['Epilogue',sans-serif] font-bold text-emerald-300 block">💵 Caja & Cobros</span>
              <span className="text-[10px] text-[#80a2c2]">Cuentas y cierre (PIN 5555)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
