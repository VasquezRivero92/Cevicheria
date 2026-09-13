import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { Order, PaymentMethod } from '../../types.js';
import { 
  Receipt, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Printer, 
  CheckCircle2, 
  Clock
} from 'lucide-react';

export const CashierView: React.FC = () => {
  const { user, currentBranch } = useAuth();
  const { lastOrderEvent } = useSocket();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('YAPE');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastPaidOrder, setLastPaidOrder] = useState<Order | null>(null);

  const loadActiveOrders = async () => {
    if (!currentBranch) return;
    try {
      const res = await fetch(`/api/orders/active/${currentBranch.id}`);
      if (res.ok) {
        const data: Order[] = await res.json();
        setActiveOrders(data);
        // Si la orden seleccionada ya no existe o cambió, refrescar
        if (selectedOrder) {
          const updated = data.find((o) => o.id === selectedOrder.id);
          setSelectedOrder(updated || null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadActiveOrders();
  }, [currentBranch?.id]);

  useEffect(() => {
    if (!lastOrderEvent) return;
    if (
      lastOrderEvent.type === 'order:created' ||
      lastOrderEvent.type === 'order:status_updated'
    ) {
      loadActiveOrders();
    }
  }, [lastOrderEvent]);

  // Liberar mesa pagada
  const handleFreeTable = async (orderId: string, tableNumber: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Confirmas que los comensales de la Mesa ${tableNumber} ya desocuparon la mesa?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      if (res.ok) {
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
        await loadActiveOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ejecutar cobro (marcar como pagado sin liberar mesa)
  const handleProcessPayment = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod
        })
      });

      if (res.ok) {
        const paid = await res.json();
        setLastPaidOrder(paid);
        setSelectedOrder(paid);
        setShowReceiptModal(true);
        setCashGiven('');
        await loadActiveOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const cashAmountNumber = parseFloat(cashGiven) || 0;
  const changeDue = selectedOrder ? Math.max(0, cashAmountNumber - selectedOrder.totalAmount) : 0;

  const isAuthorized = user?.role === 'admin_general' || user?.role === 'admin_local' || user?.role === 'cajero';

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-[#fef8f1] font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-4 text-3xl font-bold shadow-inner">
          💵
        </div>
        <h2 className="text-xl font-['Epilogue',sans-serif] font-black text-[#00223a]">Acceso de Caja</h2>
        <p className="text-sm text-[#73777e] mt-2 max-w-md">
          Esta pantalla está reservada para el personal de caja y administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-full overflow-x-hidden bg-[#fef8f1] text-[#1d1b17] p-3 sm:p-6 pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera Estilo Stitch */}
        <div className="bg-[#133854] text-white rounded-3xl p-5 sm:p-6 shadow-xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#274966]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#00223a] border-2 border-[#fc772a] rounded-2xl flex items-center justify-center text-[#fc772a] shadow-md shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-['Epilogue',sans-serif] font-black text-white tracking-tight">
                  Caja & Cobros de Mesas
                </h1>
                <span className="text-[10px] font-['Epilogue',sans-serif] font-bold uppercase bg-[#fc772a] text-white px-2 py-0.5 rounded-full shadow-sm">
                  Cuentas
                </span>
              </div>
              <p className="text-xs text-[#cee5ff] mt-0.5">
                Sede activa: <strong className="text-white font-bold">{currentBranch?.name}</strong> •{' '}
                Mesas con cuenta abierta: <strong className="text-[#fc772a] font-bold">{activeOrders.length}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: Listado de Mesas para Cobrar */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-xs font-['Epilogue',sans-serif] font-black text-[#133854] uppercase tracking-wider flex items-center gap-1.5">
              <span>Mesas con consumo activo:</span>
              <span className="px-2 py-0.5 bg-[#f3ede6] rounded-full text-[#a04100]">{activeOrders.length}</span>
            </h2>

            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#133854]/10 p-8 text-center text-[#73777e] shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-[#2ed573] mx-auto mb-2 opacity-80" />
                <p className="text-sm font-['Epilogue',sans-serif] font-bold text-[#00223a]">Todas las cuentas están cerradas</p>
                <p className="text-xs mt-1 text-[#73777e]">No hay mesas pendientes de pago en este local.</p>
              </div>
            ) : (
              activeOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer shadow-sm flex items-center justify-between ${
                      isSelected
                        ? 'border-[#fc772a] ring-4 ring-[#fc772a]/15 bg-[#fff8f3]'
                        : 'border-[#133854]/10 hover:border-[#133854]/25 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#133854] text-white flex flex-col items-center justify-center font-['Epilogue',sans-serif] font-black leading-none border border-[#274966]">
                        <span className="text-[9px] text-[#80a2c2] font-bold tracking-widest">MESA</span>
                        <span className="text-lg text-[#ffdbcc]">{order.tableNumber}</span>
                      </div>
                      <div>
                        <span className="font-['Epilogue',sans-serif] font-bold text-[#00223a] text-sm block">
                          {order.customerName || `Mesa ${order.tableNumber}`}
                        </span>
                        <span className="text-xs text-[#73777e] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#fc772a]" />
                          <span>Mozo: <strong className="text-[#00223a]">{order.waiterName}</strong></span>
                        </span>
                        <span className="text-[11px] text-[#80a2c2] font-medium">
                          {order.items.length} platos solicitados
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-base sm:text-lg font-['Epilogue',sans-serif] font-black text-[#fc772a] block">
                        S/ {order.totalAmount.toFixed(2)}
                      </span>
                      {order.status === 'PAID' ? (
                        <div className="mt-1 flex flex-col items-end gap-1">
                          <span className="text-[9px] font-['Epilogue',sans-serif] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
                            Pagado (Ocupada)
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleFreeTable(order.id, order.tableNumber, e)}
                            className="text-[10px] font-black bg-cyan-700 hover:bg-cyan-800 text-white px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1"
                          >
                            <span>🧹 Liberar</span>
                          </button>
                        </div>
                      ) : (
                        <span className={`text-[9px] font-['Epilogue',sans-serif] font-black uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'READY' ? 'bg-emerald-100 text-emerald-900 font-black' : 'bg-[#f3ede6] text-[#133854]'
                        }`}>
                          {order.status === 'READY' ? 'Listo en Cocina' : order.status === 'DELIVERED' ? 'Servido' : order.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* COLUMNA DERECHA: Detalle de Cuenta y Pasarela de Cobro */}
          <div className="lg:col-span-7">
            {selectedOrder ? (
              <div className="bg-white rounded-3xl border border-[#133854]/10 p-6 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-[#133854]/10 mb-4">
                  <div>
                    <h3 className="text-xl font-['Epilogue',sans-serif] font-black text-[#00223a]">
                      Cuenta: Mesa {selectedOrder.tableNumber}
                    </h3>
                    <p className="text-xs text-[#73777e] mt-0.5">
                      Atendido por: <strong className="text-[#133854]">{selectedOrder.waiterName}</strong> • {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-['Epilogue',sans-serif] font-black text-[#fc772a]">
                      S/ {selectedOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Detalle de Platos */}
                <div className="max-h-60 overflow-y-auto divide-y divide-[#133854]/5 mb-4 text-xs pr-1">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-['Epilogue',sans-serif] font-bold text-[#00223a] text-sm">
                          {item.quantity}x {item.productName}
                        </span>
                        {item.spiceLevel && (
                          <span className="ml-2 text-[#a04100] bg-[#fff7ed] px-2 py-0.5 rounded-full border border-[#ffedd5] font-bold text-[10px]">
                            {item.spiceLevel}
                          </span>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-[#73777e] italic mt-0.5">Nota: {item.notes}</p>
                        )}
                      </div>
                      <span className="font-['Epilogue',sans-serif] font-bold text-[#133854] text-sm">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Resumen de Montos (IGV incluido) Estilo Stitch */}
                <div className="bg-[#f3ede6] rounded-2xl p-4 mb-5 border border-[#133854]/10 text-xs space-y-1.5">
                  <div className="flex justify-between text-[#42474d]">
                    <span>Subtotal (Op. Gravada):</span>
                    <span className="font-semibold">S/ {(selectedOrder.totalAmount / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#42474d]">
                    <span>I.G.V. (18%):</span>
                    <span className="font-semibold">S/ {(selectedOrder.totalAmount - selectedOrder.totalAmount / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#00223a] font-['Epilogue',sans-serif] font-black text-sm pt-2 border-t border-[#133854]/15">
                    <span>TOTAL A PAGAR:</span>
                    <span className="text-[#fc772a] text-lg">
                      S/ {selectedOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Si la mesa ya fue pagada: panel informativo y botón para desocupar */}
                {selectedOrder.status === 'PAID' ? (
                  <div className="bg-cyan-50 border-2 border-cyan-500 rounded-2xl p-5 mb-2 text-center">
                    <div className="w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="font-['Epilogue',sans-serif] font-black text-base sm:text-lg text-cyan-950">
                      ¡Cuenta Pagada con Éxito!
                    </h4>
                    <p className="text-xs text-cyan-800 mt-1 max-w-md mx-auto">
                      Método de Pago: <strong className="text-cyan-950 uppercase">{selectedOrder.paymentMethod || 'YAPE'}</strong> • Pagado a las: {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </p>
                    <p className="text-[11px] text-cyan-700 mt-1 font-semibold">
                      La mesa continúa figurando como ocupada hasta que los comensales se retiren.
                    </p>

                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setLastPaidOrder(selectedOrder);
                          setShowReceiptModal(true);
                        }}
                        className="w-full sm:w-auto bg-white border border-cyan-400 text-cyan-900 font-['Epilogue',sans-serif] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-cyan-100 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Printer className="w-4 h-4 text-cyan-600" />
                        <span>Reimprimir Comprobante</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleFreeTable(selectedOrder.id, selectedOrder.tableNumber)}
                        className="w-full sm:w-auto bg-cyan-700 hover:bg-cyan-800 active:scale-95 text-white font-['Epilogue',sans-serif] font-black text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>🧹 Desocupar / Liberar Mesa Ahora</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Métodos de Pago */}
                    <div className="mb-5">
                      <label className="block text-xs font-['Epilogue',sans-serif] font-bold text-[#00223a] mb-2 uppercase tracking-wide">
                        Selecciona Método de Pago:
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'YAPE', label: 'Yape', icon: <QrCode className="w-5 h-5 text-purple-600" /> },
                          { id: 'PLIN', label: 'Plin', icon: <QrCode className="w-5 h-5 text-cyan-600" /> },
                          { id: 'TARJETA', label: 'Tarjeta POS', icon: <CreditCard className="w-5 h-5 text-blue-600" /> },
                          { id: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="w-5 h-5 text-emerald-600" /> }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                              paymentMethod === m.id
                                ? 'bg-[#00223a] text-white font-[\'Epilogue\',sans-serif] font-bold border-[#00223a] shadow-md ring-2 ring-[#fc772a]'
                                : 'bg-white border-[#133854]/15 text-[#42474d] hover:bg-[#f3ede6]'
                            }`}
                          >
                            {m.icon}
                            <span className="text-[11px] font-bold">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Si es efectivo, calcular vuelto */}
                    {paymentMethod === 'EFECTIVO' && (
                      <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-4 mb-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-['Epilogue',sans-serif] font-bold text-[#a04100] mb-1">
                              Monto recibido en efectivo (S/.):
                            </label>
                            <input
                              type="number"
                              step="0.10"
                              value={cashGiven}
                              onChange={(e) => setCashGiven(e.target.value)}
                              placeholder={`Ej. ${(Math.ceil(selectedOrder.totalAmount / 10) * 10).toFixed(2)}`}
                              className="w-full bg-white border border-[#fc772a]/40 rounded-xl px-3 py-2 text-sm font-['Epilogue',sans-serif] font-bold text-[#00223a] focus:outline-none focus:ring-2 focus:ring-[#fc772a]"
                            />
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-[#a04100] font-semibold block">Vuelto a entregar:</span>
                            <span className="text-xl font-['Epilogue',sans-serif] font-black text-[#fc772a]">
                              S/ {changeDue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botón de Confirmación de Cobro */}
                    <button
                      disabled={isProcessing}
                      onClick={handleProcessPayment}
                      className="w-full bg-[#fc772a] hover:bg-[#e05e16] active:scale-[0.99] text-white font-['Epilogue',sans-serif] font-black py-4 rounded-2xl shadow-xl shadow-[#fc772a]/30 flex items-center justify-center gap-2 text-sm sm:text-base transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>COBRAR S/ {selectedOrder.totalAmount.toFixed(2)} (MARCAR COMO PAGADO)</span>
                    </button>
                    <p className="text-[11px] text-[#73777e] text-center mt-2 font-medium">
                      ℹ️ La mesa continuará ocupada tras cobrar. Se desocupará cuando el personal o caja pulse "Liberar Mesa".
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#133854]/10 p-12 text-center text-[#73777e] shadow-sm">
                <Receipt className="w-16 h-16 text-[#80a2c2] mx-auto mb-3" />
                <h3 className="text-lg font-['Epilogue',sans-serif] font-bold text-[#00223a]">Selecciona una mesa</h3>
                <p className="text-xs text-[#73777e] mt-1 max-w-sm mx-auto">
                  Haz clic en una mesa de la lista izquierda para cargar el detalle de consumo, emitir el comprobante y cobrar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL TICKET / COMPROBANTE EMITIDO LA BARRA SABROSÍSIMO */}
        {showReceiptModal && lastPaidOrder && (
          <div className="fixed inset-0 bg-[#00223a]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 border-2 border-[#133854]/10">
              <div className="text-center pb-4 border-b border-dashed border-[#133854]/20">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden flex items-center justify-center bg-[#133854] border-2 border-[#fc772a]">
                  <img src="/images/logo_clean.png" alt="Logo" className="w-full h-full object-contain bg-white p-0.5" />
                </div>
                <h4 className="font-['Epilogue',sans-serif] font-black text-lg text-[#00223a] tracking-tight">
                  LA BARRA SABROSÍSIMO
                </h4>
                <p className="text-[10px] font-['Epilogue',sans-serif] font-bold uppercase tracking-wider text-[#a04100]">
                  Cevichería & Puerto Marino
                </p>
                <p className="text-[11px] text-[#73777e] mt-1">{currentBranch?.name}</p>
                <p className="text-[11px] text-[#73777e]">{currentBranch?.address}</p>
                <p className="text-[10px] text-[#80a2c2] mt-0.5">RUC: 20608945123</p>
              </div>

              <div className="py-3 border-b border-dashed border-[#133854]/20 text-xs space-y-1">
                <div className="flex justify-between text-[#42474d]">
                  <span>Mesa: <strong className="text-[#00223a] font-['Epilogue',sans-serif]">Mesa {lastPaidOrder.tableNumber}</strong></span>
                  <span>Mozo: {lastPaidOrder.waiterName}</span>
                </div>
                <div className="flex justify-between text-[#42474d]">
                  <span>Comprobante: #TKT-{lastPaidOrder.id.slice(0, 6).toUpperCase()}</span>
                  <span>Pago: <strong>{lastPaidOrder.paymentMethod}</strong></span>
                </div>
                <div className="text-[#73777e] text-[10px]">
                  {new Date().toLocaleString()}
                </div>
              </div>

              {/* Platos */}
              <div className="py-3 border-b border-dashed border-[#133854]/20 divide-y divide-[#133854]/5 text-xs">
                {lastPaidOrder.items.map((it) => (
                  <div key={it.id} className="py-1.5 flex justify-between">
                    <span className="text-[#00223a] font-medium">{it.quantity}x {it.productName}</span>
                    <span className="font-['Epilogue',sans-serif] font-bold text-[#133854]">S/ {it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="py-3 flex justify-between items-center text-sm font-['Epilogue',sans-serif] font-black text-[#00223a]">
                <span>TOTAL PAGADO:</span>
                <span className="text-xl text-[#fc772a]">
                  S/ {lastPaidOrder.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="w-full bg-[#00223a] text-white font-['Epilogue',sans-serif] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-[#133854] transition-colors"
                >
                  <Printer className="w-4 h-4 text-[#fc772a]" />
                  <span>Imprimir Comprobante</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="w-full bg-[#f3ede6] text-[#00223a] font-['Epilogue',sans-serif] font-bold py-2 rounded-xl text-xs hover:bg-[#ede7e0] transition-colors"
                >
                  Cerrar y Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
