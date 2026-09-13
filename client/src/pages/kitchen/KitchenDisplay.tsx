import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { Order, OrderStatus } from '../../types.js';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Flame, 
  RefreshCw, 
  AlertCircle,
  BellRing
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const { currentBranch } = useAuth();
  const { lastOrderEvent } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reloj para actualizar tiempos de espera
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const loadActiveOrders = async () => {
    if (!currentBranch) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/active/${currentBranch.id}`);
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error cargando órdenes para cocina:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveOrders();
  }, [currentBranch?.id]);

  // Eventos en tiempo real
  useEffect(() => {
    if (!lastOrderEvent) return;
    if (
      lastOrderEvent.type === 'order:created' ||
      lastOrderEvent.type === 'order:status_updated' ||
      lastOrderEvent.type === 'order:item_status_updated'
    ) {
      loadActiveOrders();
    }
  }, [lastOrderEvent]);

  // Cambiar estado global del pedido
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await loadActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cambiar estado individual de un plato en cocina
  const handleToggleItemReady = async (orderId: string, itemId: string, currentItemStatus: string) => {
    const nextStatus = currentItemStatus === 'READY' ? 'PREPARING' : 'READY';
    try {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        await loadActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cálculo de tiempo transcurrido
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = nowTime - new Date(dateStr).getTime();
    return Math.floor(diffMs / (1000 * 60));
  };

  const getTimeBadgeColor = (minutes: number) => {
    if (minutes < 10) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (minutes < 20) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
  };

  const kitchenOrders = orders.filter((o) => ['PENDING', 'PREPARING', 'READY'].includes(o.status));

  const filteredOrders = kitchenOrders.filter((o) => {
    if (filterType === 'all') return true;
    if (filterType === 'pending') return o.status === 'PENDING';
    if (filterType === 'preparing') return o.status === 'PREPARING';
    if (filterType === 'ready') return o.status === 'READY';
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a1d37] text-slate-100 p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Cabecera de Cocina / KDS Estilo Stitch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#133854] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#133854] border-2 border-[#fc772a] rounded-2xl flex items-center justify-center text-[#fc772a] shadow-lg shadow-[#fc772a]/20">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-['Epilogue',sans-serif] font-black text-white tracking-tight">
                Barra & Cocina KDS
              </h1>
              <span className="text-[10px] font-['Epilogue',sans-serif] font-extrabold uppercase bg-[#fc772a] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                En Vivo
              </span>
            </div>
            <p className="text-xs text-[#80a2c2] mt-0.5">
              Sede: <strong className="text-white font-bold">{currentBranch?.name}</strong> • Comandas en cocina:{' '}
              <strong className="text-[#fc772a] font-bold">{kitchenOrders.length}</strong>
            </p>
          </div>
        </div>

        {/* Filtros de estado Stitch style */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#133854]/80 p-1 rounded-full border border-[#274966] text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-full font-['Epilogue',sans-serif] font-bold transition-all ${
                filterType === 'all' ? 'bg-[#fc772a] text-white shadow-sm' : 'text-[#80a2c2] hover:text-white'
              }`}
            >
              Todos ({kitchenOrders.length})
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-3.5 py-1.5 rounded-full font-['Epilogue',sans-serif] font-bold transition-all ${
                filterType === 'pending' ? 'bg-[#fc772a] text-white shadow-sm' : 'text-[#80a2c2] hover:text-white'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilterType('preparing')}
              className={`px-3.5 py-1.5 rounded-full font-['Epilogue',sans-serif] font-bold transition-all ${
                filterType === 'preparing' ? 'bg-[#fc772a] text-white shadow-sm' : 'text-[#80a2c2] hover:text-white'
              }`}
            >
              En Preparación
            </button>
            <button
              onClick={() => setFilterType('ready')}
              className={`px-3.5 py-1.5 rounded-full font-['Epilogue',sans-serif] font-bold transition-all ${
                filterType === 'ready' ? 'bg-[#2ed573] text-slate-950 shadow-sm' : 'text-[#80a2c2] hover:text-white'
              }`}
            >
              Listos
            </button>
          </div>

          <button
            onClick={loadActiveOrders}
            className="p-2.5 bg-[#133854] hover:bg-[#1a4b70] text-[#80a2c2] hover:text-white rounded-full border border-[#274966] transition-colors"
            title="Actualizar tickets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Si no hay comandas activas */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-20 bg-[#133854]/40 rounded-3xl border border-[#133854] max-w-xl mx-auto backdrop-blur-sm">
          <CheckCircle2 className="w-16 h-16 text-[#2ed573] mx-auto mb-3 opacity-90" />
          <h2 className="text-xl font-['Epilogue',sans-serif] font-bold text-white">¡Cocina al día!</h2>
          <p className="text-xs text-[#80a2c2] mt-1">
            No hay comandas pendientes de preparación en este momento para {currentBranch?.name}.
          </p>
        </div>
      )}

      {/* Tablero de Comandas Estilo Galera Marina */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredOrders.map((order) => {
          const elapsedMins = getElapsedMinutes(order.createdAt);

          return (
            <div
              key={order.id}
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                order.status === 'READY'
                  ? 'bg-[#0f3427] border-[#2ed573] ring-2 ring-[#2ed573]/30'
                  : order.status === 'PREPARING'
                  ? 'bg-[#132c48] border-[#29b6f6]/60'
                  : 'bg-[#182333] border-[#fc772a]/50'
              }`}
            >
              {/* Cabecera del Ticket */}
              <div className="p-4 bg-[#0e1e32] border-b border-[#274966] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-['Epilogue',sans-serif] font-black text-white tracking-tight">
                      MESA {order.tableNumber}
                    </span>
                    {order.status === 'READY' && (
                      <span className="text-[10px] font-['Epilogue',sans-serif] bg-[#2ed573] text-slate-950 font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <BellRing className="w-3 h-3" /> ¡LISTO!
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#80a2c2]">
                    Mozo: <strong className="text-slate-100">{order.waiterName}</strong>
                  </span>
                </div>

                {/* Temporizador */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-['Epilogue',sans-serif] font-black border flex items-center gap-1.5 shadow-sm ${getTimeBadgeColor(
                    elapsedMins
                  )}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{elapsedMins} min</span>
                </div>
              </div>

              {/* Lista de Platos en el Ticket */}
              <div className="p-4 flex-1 divide-y divide-[#274966]/40 space-y-3 bg-[#132438]/50">
                {order.items.map((item) => {
                  const isItemReady = item.status === 'READY';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItemReady(order.id, item.id, item.status)}
                      className={`pt-2.5 cursor-pointer rounded-2xl p-2.5 -mx-1.5 transition-colors ${
                        isItemReady
                          ? 'bg-[#0f3427]/40 text-[#80a2c2] line-through'
                          : 'hover:bg-[#1a3450] text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-xl text-xs font-['Epilogue',sans-serif] font-black flex items-center justify-center shrink-0 shadow-sm ${
                              isItemReady
                                ? 'bg-[#2ed573] text-slate-950'
                                : 'bg-[#fc772a] text-white'
                            }`}
                          >
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="font-['Epilogue',sans-serif] font-bold text-sm block leading-snug">
                              {item.productName}
                            </span>

                            {/* Picante */}
                            {item.spiceLevel && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ffdbcc] bg-[#7a3000]/80 px-2 py-0.5 rounded-full border border-[#fc772a]/50 mt-1 mr-1">
                                <Flame className="w-3 h-3 text-[#fc772a]" />
                                {item.spiceLevel}
                              </span>
                            )}

                            {/* Guarniciones */}
                            {item.selectedSides && item.selectedSides.length > 0 && (
                              <span className="text-[11px] text-[#80a2c2] block mt-1">
                                Con: <strong className="text-white">{item.selectedSides.join(', ')}</strong>
                              </span>
                            )}

                            {/* Observación destacada en amarillo para cocina */}
                            {item.notes && (
                              <div className="mt-1.5 bg-[#fef08a] text-[#713f12] text-[11px] font-bold px-2 py-0.5 rounded-lg inline-block shadow-sm">
                                ⚠️ NOTA: {item.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`w-7 h-7 rounded-full text-xs font-bold shrink-0 flex items-center justify-center border transition-all ${
                            isItemReady
                              ? 'bg-[#2ed573] border-[#2ed573] text-slate-950'
                              : 'border-[#274966] text-[#80a2c2] hover:border-[#fc772a] hover:text-[#fc772a]'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Nota general de comanda */}
                {order.notes && (
                  <div className="pt-2.5 text-xs text-[#fc772a] italic flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Ronda: <strong>{order.notes}</strong></span>
                  </div>
                )}
              </div>

              {/* Botones de Acción de Cocina */}
              <div className="p-3 bg-[#0e1e32] border-t border-[#274966] flex items-center gap-2">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                    className="flex-1 bg-[#133854] hover:bg-[#1a4b70] border border-[#274966] text-white font-['Epilogue',sans-serif] font-black text-xs py-2.5 rounded-2xl shadow-md transition-all active:scale-[0.98]"
                  >
                    EMPEZAR PREPARACIÓN
                  </button>
                )}

                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                    className="flex-1 bg-[#fc772a] hover:bg-[#e05e16] text-white font-['Epilogue',sans-serif] font-black text-xs py-2.5 rounded-2xl shadow-lg shadow-[#fc772a]/30 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ¡TODO LISTO PARA SERVIR! 🛎️
                  </button>
                )}

                {order.status === 'READY' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                    className="flex-1 bg-[#2ed573] hover:bg-[#26af5f] text-slate-950 font-['Epilogue',sans-serif] font-black text-xs py-2.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    MARCAR ENTREGADO A MESA
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
