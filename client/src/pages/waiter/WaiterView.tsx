import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { 
  BranchProductView, 
  Category, 
  Order, 
  SpiceLevel, 
  OrderStatus,
  PaymentMethod 
} from '../../types.js';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Search, 
  Flame, 
  CheckCircle2, 
  Clock, 
  X, 
  ShoppingBag, 
  ArrowLeft, 
  AlertTriangle,
  Waves,
  Sliders,
  Sparkles,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Printer
} from 'lucide-react';

interface CartItem {
  product: BranchProductView;
  quantity: number;
  spiceLevel?: SpiceLevel;
  selectedSides: string[];
  notes: string;
  unitPrice: number;
  subtotal: number;
}

// Mapeo inteligente de fotografía gastronómica peruana para la carta
const getProductImage = (product: BranchProductView): string => {
  if (product.image) return product.image;
  const name = product.name.toLowerCase();
  if (name.includes('pantera')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
  if (name.includes('leche')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
  if (name.includes('conchas')) return 'https://images.unsplash.com/photo-1559742811-8228636474e4?auto=format&fit=crop&w=600&q=80';
  if (name.includes('ceviche') || name.includes('cebiche')) return 'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=600&q=80';
  if (name.includes('parihuela') || name.includes('sudado') || name.includes('chilcano')) return 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80';
  if (name.includes('arroz') || name.includes('chaufa')) return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80';
  if (name.includes('chicharron') || name.includes('jalea') || name.includes('duo') || name.includes('trio')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80';
  if (name.includes('cerveza') || name.includes('pilsen') || name.includes('cusqueña')) return 'https://images.unsplash.com/photo-1608270123531-a0c326d97c7e?auto=format&fit=crop&w=600&q=80';
  if (name.includes('gaseosa') || name.includes('inca kola') || name.includes('refresco') || name.includes('chicha')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80';
  return 'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=600&q=80';
};

export const WaiterView: React.FC = () => {
  const { user, currentBranch } = useAuth();
  const { lastOrderEvent } = useSocket();

  // Estados principales
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [products, setProducts] = useState<BranchProductView[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  
  // Carrito / Comanda actual
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modal de personalización de plato
  const [customizingProduct, setCustomizingProduct] = useState<BranchProductView | null>(null);
  const [customQty, setCustomQty] = useState<number>(1);
  const [customSpice, setCustomSpice] = useState<SpiceLevel>('MEDIO');
  const [customSides, setCustomSides] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Selector temporal de picor por tarjeta
  const [cardSpiceMap, setCardSpiceMap] = useState<{ [productId: string]: SpiceLevel }>({});

  // Modal de cobro y resumen de consumo para mozo / salón
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [billingPaymentMethod, setBillingPaymentMethod] = useState<PaymentMethod>('YAPE');
  const [billingCashGiven, setBillingCashGiven] = useState<string>('');
  const [isBillingProcessing, setIsBillingProcessing] = useState<boolean>(false);
  const [paidReceiptOrder, setPaidReceiptOrder] = useState<Order | null>(null);

  // Cargar categorías y carta adaptada para la sede actual
  const loadBranchCatalog = async () => {
    if (!currentBranch) return;
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch('/api/catalog/categories'),
        fetch(`/api/catalog/branch/${currentBranch.id}`)
      ]);
      if (catsRes.ok && prodsRes.ok) {
        const catsData = await catsRes.json();
        const prodsData = await prodsRes.json();
        setCategories(catsData);
        setProducts(prodsData);
      }
    } catch (err) {
      console.error('Error cargando carta:', err);
    }
  };

  // Cargar pedidos activos de la sede para pintar el mapa de mesas
  const loadActiveOrders = async () => {
    if (!currentBranch) return;
    try {
      const res = await fetch(`/api/orders/active/${currentBranch.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveOrders(data);
      }
    } catch (err) {
      console.error('Error cargando órdenes activas:', err);
    }
  };

  useEffect(() => {
    loadBranchCatalog();
    loadActiveOrders();
  }, [currentBranch?.id]);

  // Escuchar eventos en tiempo real vía WebSocket
  useEffect(() => {
    if (!lastOrderEvent) return;
    if (
      lastOrderEvent.type === 'order:created' ||
      lastOrderEvent.type === 'order:status_updated' ||
      lastOrderEvent.type === 'order:item_status_updated'
    ) {
      loadActiveOrders();
    }
    if (lastOrderEvent.type === 'catalog:availability_changed') {
      loadBranchCatalog();
    }
  }, [lastOrderEvent]);

  // Obtener orden activa de la mesa seleccionada si ya existe
  const currentTableOrder = selectedTable
    ? activeOrders.find((o) => o.tableNumber === selectedTable)
    : null;

  // Abrir modal de personalización completo
  const handleOpenCustomization = (product: BranchProductView) => {
    if (!product.isAvailableInBranch) return;
    setCustomizingProduct(product);
    setCustomQty(1);
    setCustomSpice(cardSpiceMap[product.id] || 'MEDIO');
    setCustomSides(product.sidesAllowed.length > 0 ? [product.sidesAllowed[0]] : []);
    setCustomNotes('');
  };

  // Agregar directamente desde la tarjeta con el picor seleccionado
  const handleQuickAdd = (product: BranchProductView) => {
    if (!product.isAvailableInBranch) return;
    const unitPrice = product.effectivePrice;
    const chosenSpice = product.spiceAllowed ? (cardSpiceMap[product.id] || 'MEDIO') : undefined;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.product.id === product.id && it.spiceLevel === chosenSpice && it.selectedSides.length === 0 && !it.notes
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].subtotal = updated[existingIdx].quantity * unitPrice;
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          spiceLevel: chosenSpice,
          selectedSides: [],
          notes: '',
          unitPrice,
          subtotal: unitPrice
        }
      ];
    });
  };

  // Disminuir cantidad rápida
  const handleQuickDecrease = (productId: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((it) => it.product.id === productId);
      if (existingIdx < 0) return prev;
      const updated = [...prev];
      if (updated[existingIdx].quantity > 1) {
        updated[existingIdx].quantity -= 1;
        updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
        return updated;
      } else {
        return updated.filter((_, i) => i !== existingIdx);
      }
    });
  };

  const getProductCartCount = (productId: string) => {
    return cart
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleAddCustomizedToCart = () => {
    if (!customizingProduct) return;

    const unitPrice = customizingProduct.effectivePrice;
    const subtotal = unitPrice * customQty;

    setCart((prev) => [
      ...prev,
      {
        product: customizingProduct,
        quantity: customQty,
        spiceLevel: customizingProduct.spiceAllowed ? customSpice : undefined,
        selectedSides: customSides,
        notes: customNotes,
        unitPrice,
        subtotal
      }
    ]);

    setCustomizingProduct(null);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Enviar comanda a cocina vía WebSocket y REST
  const handleSendOrder = async () => {
    if (!selectedTable || cart.length === 0 || !user || !currentBranch) return;

    setIsSubmitting(true);
    try {
      const payload = {
        branchId: currentBranch.id,
        tableNumber: selectedTable,
        waiterId: user.id,
        waiterName: user.name,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          spiceLevel: c.spiceLevel,
          selectedSides: c.selectedSides,
          notes: c.notes
        })),
        notes: orderNotes
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMessage(`¡Comanda enviada a Cocina para Mesa ${selectedTable}! 🐟🚀`);
        setCart([]);
        setOrderNotes('');
        setIsCartOpen(false);
        await loadActiveOrders();

        setTimeout(() => {
          setSuccessMessage('');
        }, 4000);
      } else {
        const err = await res.json();
        alert(`Error al enviar: ${err.error || 'Intente nuevamente'}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Marcar pedido como servido por el mozo a los comensales
  const handleMarkAsDelivered = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' })
      });
      if (res.ok) {
        setSuccessMessage('¡Platos marcados como SERVIDOS a los comensales! 🍽️✨');
        await loadActiveOrders();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Liberar y desocupar la mesa
  const handleFreeTable = async (orderId: string, tableNum: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Confirmas que los comensales de la Mesa ${tableNum} ya se retiraron y la mesa quedó limpia y disponible?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      if (res.ok) {
        setSuccessMessage(`¡Mesa ${tableNum} liberada y disponible para nuevos clientes! 🧹✨`);
        if (selectedTable === tableNum) {
          setSelectedTable(null);
          setCart([]);
        }
        await loadActiveOrders();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir modal de cobro con resumen de consumo de la mesa
  const handleOpenBillingModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBillingOrder(order);
    setBillingPaymentMethod('YAPE');
    setBillingCashGiven('');
  };

  // Procesar cobro de la comanda
  const handleProcessOrderPayment = async () => {
    if (!billingOrder) return;
    setIsBillingProcessing(true);
    try {
      const res = await fetch(`/api/orders/${billingOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: billingPaymentMethod
        })
      });

      if (res.ok) {
        const paid = await res.json();
        setPaidReceiptOrder(paid);
        setBillingOrder(null);
        setSuccessMessage(`¡Pago de S/ ${paid.totalAmount.toFixed(2)} registrado para Mesa ${paid.tableNumber}! (Mesa continúa ocupada)`);
        await loadActiveOrders();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const err = await res.json();
        alert(`Error al registrar cobro: ${err.error || 'Intente nuevamente'}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setIsBillingProcessing(false);
    }
  };

  // Filtrado de productos por categoría y búsqueda
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">En Cocina</span>;
      case 'PREPARING':
        return <span className="bg-sky-100 text-sky-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold">Preparando</span>;
      case 'READY':
        return <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black ring-2 ring-emerald-300 animate-pulse">¡Listo para Servir!</span>;
      case 'DELIVERED':
        return <span className="bg-purple-100 text-purple-900 text-[10px] px-2 py-0.5 rounded-full font-bold">Servido en Mesa</span>;
      case 'PAID':
        return <span className="bg-cyan-100 text-cyan-950 text-[10px] px-2 py-0.5 rounded-full font-black border border-cyan-300">Pagado (Ocupada)</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Disponible</span>;
      default:
        return null;
    }
  };

  const renderBillingAndReceiptModals = () => (
    <>
      {/* ========================================================================= */}
      {/* MODAL: RESUMEN DE CONSUMO & COBRO DE MESA (ESTILO STITCH) */}
      {/* ========================================================================= */}
      {billingOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 border border-slate-200">
            {/* Cabecera del Resumen */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#133854] text-[#fc772a] flex items-center justify-center font-['Epilogue',sans-serif] font-black text-sm border border-[#274966] shadow-sm shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Epilogue',sans-serif] font-black text-base sm:text-lg text-slate-900">
                    Resumen de Consumo - Mesa {billingOrder.tableNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mozo: <strong className="text-slate-800 font-bold">{billingOrder.waiterName}</strong> • {currentBranch?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBillingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Listado de Platos Consumidos por la Mesa */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 max-h-56 pr-1 divide-y divide-slate-100 text-xs">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 pb-1 flex justify-between">
                <span>Plato / Producto</span>
                <span>Subtotal</span>
              </div>
              {billingOrder.items.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="text-[#133854] font-black text-sm">{item.quantity}x</strong>
                      <span className="font-bold text-slate-900 text-sm">{item.productName}</span>
                      <span className="text-[10px] text-slate-500">(c/u S/ {item.unitPrice.toFixed(2)})</span>
                    </div>
                    {item.spiceLevel && (
                      <span className="inline-block text-[10px] text-[#f37023] font-bold mr-2">
                        Ají: {item.spiceLevel}
                      </span>
                    )}
                    {item.selectedSides && item.selectedSides.length > 0 && (
                      <span className="text-[10px] text-slate-500 block">
                        Guarnición: {item.selectedSides.join(', ')}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-[10px] text-slate-400 italic block">
                        "{item.notes}"
                      </span>
                    )}
                  </div>
                  <span className="font-['Epilogue',sans-serif] font-black text-slate-900 text-sm shrink-0">
                    S/ {item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Resumen de Montos (IGV incluido) */}
            <div className="bg-[#fef8f1] rounded-2xl p-3.5 my-3 border border-amber-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Op. Gravada):</span>
                <span className="font-semibold">S/ {(billingOrder.totalAmount / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>I.G.V. (18%):</span>
                <span className="font-semibold">S/ {(billingOrder.totalAmount - billingOrder.totalAmount / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 font-['Epilogue',sans-serif] font-black pt-2 border-t border-amber-200">
                <span className="text-sm">TOTAL A COBRAR:</span>
                <span className="text-2xl text-[#f37023]">
                  S/ {billingOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div className="mb-3">
              <label className="block text-xs font-['Epilogue',sans-serif] font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                Método de Pago:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'YAPE', label: 'Yape', icon: <QrCode className="w-4 h-4 text-purple-600" /> },
                  { id: 'PLIN', label: 'Plin', icon: <QrCode className="w-4 h-4 text-cyan-600" /> },
                  { id: 'TARJETA', label: 'Tarjeta POS', icon: <CreditCard className="w-4 h-4 text-blue-600" /> },
                  { id: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="w-4 h-4 text-emerald-600" /> }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBillingPaymentMethod(m.id as PaymentMethod)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      billingPaymentMethod === m.id
                        ? 'bg-[#133854] text-white font-bold border-[#133854] shadow-md ring-2 ring-[#fc772a]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m.icon}
                    <span className="text-[10px] font-bold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Si es efectivo: cálculo de vuelto */}
            {billingPaymentMethod === 'EFECTIVO' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-amber-900 mb-0.5">
                      Efectivo recibido (S/.):
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      value={billingCashGiven}
                      onChange={(e) => setBillingCashGiven(e.target.value)}
                      placeholder={`Ej. ${(Math.ceil(billingOrder.totalAmount / 10) * 10).toFixed(2)}`}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f37023]"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-800 font-semibold block">Vuelto:</span>
                    <span className="text-lg font-['Epilogue',sans-serif] font-black text-[#f37023]">
                      S/ {Math.max(0, (parseFloat(billingCashGiven) || 0) - billingOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones de Cobro */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <button
                disabled={isBillingProcessing}
                onClick={handleProcessOrderPayment}
                className="w-full bg-gradient-to-r from-[#fc772a] to-[#ff6f00] hover:from-[#ff6f00] hover:to-[#e65100] active:scale-[0.99] disabled:opacity-50 text-white font-['Epilogue',sans-serif] font-black py-3 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isBillingProcessing ? 'Registrando cobro...' : `REGISTRAR PAGO S/ ${billingOrder.totalAmount.toFixed(2)}`}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Imprimir Pre-cuenta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingOrder(null)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 font-semibold py-2 rounded-xl text-xs transition-colors"
                >
                  Volver / Cerrar
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium">
                ℹ️ Al cobrar, la comanda queda pagada y la mesa seguirá ocupada hasta pulsar "Liberar Mesa".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMPROBANTE DE PAGO REGISTRADO */}
      {/* ========================================================================= */}
      {paidReceiptOrder && (
        <div className="fixed inset-0 bg-[#00223a]/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 border-2 border-slate-200">
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden flex items-center justify-center bg-[#133854] border-2 border-[#fc772a]">
                <img src="/images/logo_clean.png" alt="Logo" className="w-full h-full object-contain bg-white p-0.5" />
              </div>
              <h4 className="font-['Epilogue',sans-serif] font-black text-lg text-[#00223a] tracking-tight">
                LA BARRA SABROSÍSIMO
              </h4>
              <p className="text-[10px] font-['Epilogue',sans-serif] font-bold uppercase tracking-wider text-[#a04100]">
                Cevichería & Puerto Marino
              </p>
              <p className="text-[11px] text-slate-600 mt-1">{currentBranch?.name}</p>
              <p className="text-[11px] text-slate-500">{currentBranch?.address}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">RUC: 20608945123</p>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>Mesa: <strong className="text-[#00223a] font-['Epilogue',sans-serif]">Mesa {paidReceiptOrder.tableNumber}</strong></span>
                <span>Mozo: {paidReceiptOrder.waiterName}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Ticket: #TKT-{paidReceiptOrder.id.slice(0, 6).toUpperCase()}</span>
                <span>Pago: <strong>{paidReceiptOrder.paymentMethod}</strong></span>
              </div>
              <div className="text-slate-400 text-[10px]">
                {new Date().toLocaleString()}
              </div>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 divide-y divide-slate-100 text-xs max-h-40 overflow-y-auto">
              {paidReceiptOrder.items.map((it) => (
                <div key={it.id} className="py-1.5 flex justify-between">
                  <span className="text-slate-800 font-medium">{it.quantity}x {it.productName}</span>
                  <span className="font-['Epilogue',sans-serif] font-bold text-[#133854]">S/ {it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="py-3 flex justify-between items-center text-sm font-['Epilogue',sans-serif] font-black text-slate-900">
              <span>TOTAL PAGADO:</span>
              <span className="text-xl text-[#fc772a]">
                S/ {paidReceiptOrder.totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full bg-[#00223a] text-white font-['Epilogue',sans-serif] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-[#133854] transition-colors"
              >
                <Printer className="w-4 h-4 text-[#fc772a]" />
                <span>Imprimir Comprobante</span>
              </button>
              <button
                onClick={() => setPaidReceiptOrder(null)}
                className="w-full bg-[#f3ede6] text-[#00223a] font-['Epilogue',sans-serif] font-bold py-2 rounded-xl text-xs hover:bg-[#ede7e0] transition-colors"
              >
                Cerrar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // =========================================================================
  // VISTA 1: PLANO TÁCTIL DE MESAS (CUANDO NO HAY MESA SELECCIONADA)
  // =========================================================================
  if (!selectedTable) {
    const tableTotal = currentBranch?.tableCount || 12;
    const tableNumbers = Array.from({ length: tableTotal }, (_, i) => i + 1);

    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#fef8f1] font-['Plus_Jakarta_Sans',sans-serif] pb-28">
        {/* Cabecera Estilo Stitch */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-cyan-300 to-amber-400 p-0.5 shadow-md flex items-center justify-center overflow-hidden bg-white">
                <img 
                  src="/images/logo_clean.png" 
                  alt="La Barra Sabrosísimo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-['Epilogue',sans-serif] font-black text-base text-[#133854] tracking-tight leading-tight flex items-center gap-1.5">
                  <span>La Barra Sabrosísimo</span>
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Marisquería & Barra Cevichera • La Mar nos une</span>
                </div>
              </div>
            </div>

            {/* Badge de Sede Activa */}
            <div className="inline-flex items-center gap-1.5 bg-[#fef8f1] border border-sky-200 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold text-[#133854]">
              <Waves className="w-3.5 h-3.5 text-[#f37023]" />
              <span>{currentBranch?.name}</span>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Banner Ilustrado Panorámico Oficial */}
          <div className="rounded-3xl overflow-hidden shadow-lg shadow-sky-950/10 mb-6 border border-sky-200 bg-white">
            <img 
              src="/images/banner_olas.png" 
              alt="Disfruta el sabor del mar" 
              className="w-full h-auto object-cover max-h-36 sm:max-h-48"
            />
          </div>

          {/* Tarjeta de Saludo y Estado de la Barra */}
          <div className="bg-gradient-to-r from-[#133854] via-[#1b4b70] to-[#0a1d37] text-white rounded-3xl p-5 sm:p-6 shadow-xl mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f37023] text-white font-['Epilogue',sans-serif] text-[11px] font-black uppercase tracking-wider mb-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>¡COSTA VIVA PERUANA!</span>
              </div>
              <h2 className="font-['Epilogue',sans-serif] text-xl sm:text-2xl font-black tracking-tight leading-tight">
                ¡Sabor Bravazo frente al Pacífico!
              </h2>
              <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-xl">
                Limón recién exprimido, pesca artesanal fresca y ají limo picadito al momento.
                Selecciona la mesa para tomar la comanda.
              </p>

              <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Pesca del Día: Puerto de Chorrillos (6:30 AM)</span>
                </div>
                <div className="flex items-center gap-3 font-semibold text-sky-200">
                  <span>Mozo de Turno: <strong className="text-white">{user?.name}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-600 text-white text-sm font-bold rounded-2xl shadow-lg flex items-center gap-2.5 animate-bounce">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Selector de Mesas */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-['Epilogue',sans-serif] text-lg font-black text-[#133854]">
                Plano de Salón y Barra
              </h3>
              <p className="text-xs text-slate-500">
                Toca una mesa para ingresar y tomar el pedido de los comensales
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Libre</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#f37023]" />
                <span className="text-slate-600">En Cocina</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-pulse" />
                <span className="text-slate-600">Listo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-600">Servido</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                <span className="text-slate-600">Pagado</span>
              </div>
            </div>
          </div>

          {/* Grid de Mesas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {tableNumbers.map((num) => {
              const orderForTable = activeOrders.find((o) => o.tableNumber === num);
              const isOccupied = !!orderForTable;

              let cardBg = 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md text-slate-800';
              if (isOccupied) {
                if (orderForTable.status === 'READY') {
                  cardBg = 'bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400 shadow-md';
                } else if (orderForTable.status === 'PAID') {
                  cardBg = 'bg-cyan-50/90 border-cyan-500 text-cyan-950 shadow-md';
                } else if (orderForTable.status === 'DELIVERED') {
                  cardBg = 'bg-purple-50/80 border-purple-400 text-purple-950 shadow-sm';
                } else {
                  cardBg = 'bg-orange-50/80 border-[#f37023] text-[#133854]';
                }
              }

              return (
                <div
                  key={num}
                  onClick={() => setSelectedTable(num)}
                  className={`min-h-[140px] rounded-3xl p-3 flex flex-col justify-between items-center transition-all transform active:scale-98 shadow-sm border-2 cursor-pointer ${cardBg}`}
                >
                  <div className="w-full flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-wider text-slate-400">MESA</span>
                    {isOccupied && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          orderForTable.status === 'READY'
                            ? 'bg-emerald-500 animate-ping'
                            : orderForTable.status === 'PAID'
                            ? 'bg-cyan-600'
                            : orderForTable.status === 'DELIVERED'
                            ? 'bg-purple-600'
                            : 'bg-[#f37023] animate-ping'
                        }`}
                      />
                    )}
                  </div>

                  <span className="font-['Epilogue',sans-serif] text-3xl sm:text-4xl font-black tracking-tight my-1">
                    {num < 10 ? `0${num}` : num}
                  </span>

                  <div className="w-full text-center">
                    {isOccupied ? (
                      <div className="space-y-1">
                        <span className="text-[11px] font-black text-[#133854] block truncate">
                          S/ {orderForTable.totalAmount.toFixed(2)}
                        </span>
                        <div className="flex justify-center">
                          {getStatusBadge(orderForTable.status)}
                        </div>

                        {/* Botón directo en la tarjeta cuando está listo para servir */}
                        {orderForTable.status === 'READY' && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsDelivered(orderForTable.id, e)}
                            className="mt-1.5 w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-black py-1 px-1 rounded-xl shadow-sm flex items-center justify-center gap-1 transition-all"
                            title="Confirmar platos servidos a los comensales"
                          >
                            <span>🍽️ Ya lo serví</span>
                          </button>
                        )}

                        {/* Botón directo en la tarjeta cuando ya se sirvió para cobrar con resumen */}
                        {orderForTable.status === 'DELIVERED' && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenBillingModal(orderForTable, e)}
                            className="mt-1.5 w-full bg-[#133854] hover:bg-[#1a4b70] active:scale-95 text-white text-[10px] font-black py-1 px-1 rounded-xl shadow-sm flex items-center justify-center gap-1 transition-all border border-[#274966]"
                            title="Ver resumen de lo consumido y cobrar la cuenta"
                          >
                            <Receipt className="w-3 h-3 text-[#fc772a]" />
                            <span>💳 Cobrar</span>
                          </button>
                        )}

                        {/* Botón directo en la tarjeta cuando está pagado para liberar */}
                        {orderForTable.status === 'PAID' && (
                          <button
                            type="button"
                            onClick={(e) => handleFreeTable(orderForTable.id, num, e)}
                            className="mt-1.5 w-full bg-cyan-700 hover:bg-cyan-800 active:scale-95 text-white text-[10px] font-black py-1 px-1 rounded-xl shadow-sm flex items-center justify-center gap-1 transition-all"
                            title="Desocupar y liberar mesa"
                          >
                            <span>🧹 Liberar</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                        Disponible
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {renderBillingAndReceiptModals()}
      </div>
    );
  }

  // =========================================================================
  // VISTA 2: MENÚ & COMANDERO MÓVIL ESTILO STITCH (MESA SELECCIONADA)
  // =========================================================================
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#fef8f1] font-['Plus_Jakarta_Sans',sans-serif] pb-36">
      {/* TOP APP BAR FLOTANTE (ESTILO STITCH) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 py-2.5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Botón Salir / Mesa actual */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (cart.length > 0 && !confirm('¿Deseas cambiar de mesa? Los platos en la comanda no guardados se perderán.')) {
                  return;
                }
                setSelectedTable(null);
                setCart([]);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors border border-slate-200"
              title="Volver al plano de mesas"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-amber-400 p-0.5 shadow-sm flex items-center justify-center overflow-hidden bg-white shrink-0">
              <img 
                src="/images/logo_clean.png" 
                alt="Logo La Barra" 
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <h2 className="font-['Epilogue',sans-serif] font-black text-sm text-[#133854] leading-tight flex items-center gap-1.5">
                <span>La Barra Sabrosísimo</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-semibold leading-none mt-0.5">
                {currentBranch?.name} • Mozo: {user?.name}
              </p>
            </div>
          </div>

          {/* Badge de Mesa Activa y Botón Comanda */}
          <div className="flex items-center gap-2">
            <div className="bg-[#133854] text-white px-3 py-1.5 rounded-full text-xs font-['Epilogue',sans-serif] font-black tracking-wider flex items-center gap-1.5 shadow-sm">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#ffc107]" />
              <span>Mesa {selectedTable < 10 ? `0${selectedTable}` : selectedTable}</span>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-[#f37023] hover:bg-[#ff6f00] text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>S/ {totalCartAmount.toFixed(2)}</span>
              {totalCartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#133854] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalCartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO DE LA CARTA */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-16">
        {/* Banner Costero de Bienvenida */}
        <div className="mt-2 mb-4 bg-gradient-to-r from-[#133854] via-[#1b4b70] to-[#0a1d37] rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f37023] text-white text-[10px] font-black uppercase font-['Epilogue',sans-serif] mb-1">
                <span>¡SABROSO & FRESCO!</span>
              </div>
              <h3 className="font-['Epilogue',sans-serif] text-base sm:text-lg font-black tracking-tight leading-tight">
                Carta Cevichería & Barra Marina
              </h3>
              <p className="text-[12px] text-sky-100 mt-0.5">
                {currentTableOrder 
                  ? `Mesa ${selectedTable} tiene un pedido en cocina de S/ ${currentTableOrder.totalAmount.toFixed(2)}`
                  : `Tomando comanda inicial para Mesa ${selectedTable}`}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pesca del Día: 6:30 AM</span>
            </div>
          </div>
        </div>

        {/* Banner contextual de estado de la mesa actual */}
        {currentTableOrder && (
          <div className="mb-4">
            {currentTableOrder.status === 'READY' && (
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <h4 className="font-['Epilogue',sans-serif] font-black text-emerald-950 text-sm">
                      ¡Platos listos en Barra/Cocina para Mesa {selectedTable}!
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Por favor llévalos a la mesa y confirma cuando ya los hayas servido a los comensales.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkAsDelivered(currentTableOrder.id)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-['Epilogue',sans-serif] font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar: Ya lo serví 🍽️</span>
                </button>
              </div>
            )}

            {currentTableOrder.status === 'DELIVERED' && (
              <div className="bg-purple-50 border-2 border-purple-400 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-['Epilogue',sans-serif] font-black text-purple-950 text-sm">
                        Mesa {selectedTable} Servida • Consumo: S/ {currentTableOrder.totalAmount.toFixed(2)}
                      </h4>
                      <span className="text-[10px] font-black bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full uppercase">
                        Servido
                      </span>
                    </div>
                    <p className="text-xs text-purple-800 mt-0.5">
                      Los clientes están consumiendo. Puedes pedir más platos abajo o pulsar "Cobrar Cuenta" para ver el resumen de consumo y procesar el cobro.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenBillingModal(currentTableOrder)}
                  className="w-full sm:w-auto bg-[#133854] hover:bg-[#1a4b70] active:scale-95 text-white font-['Epilogue',sans-serif] font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all shrink-0 border border-[#274966]"
                >
                  <Receipt className="w-4 h-4 text-[#fc772a]" />
                  <span>💳 Cobrar Cuenta (Pre-cuenta)</span>
                </button>
              </div>
            )}

            {currentTableOrder.status === 'PAID' && (
              <div className="bg-cyan-50 border-2 border-cyan-500 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h4 className="font-['Epilogue',sans-serif] font-black text-cyan-950 text-sm">
                      Cuenta Pagada (S/ {currentTableOrder.totalAmount.toFixed(2)} - {currentTableOrder.paymentMethod || 'PAGO'})
                    </h4>
                    <p className="text-xs text-cyan-800">
                      La mesa sigue ocupada. Puedes liberarla cuando los clientes se retiren, o agregar platos adicionales si piden algo más.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFreeTable(currentTableOrder.id, selectedTable)}
                  className="w-full sm:w-auto bg-cyan-700 hover:bg-cyan-800 active:scale-95 text-white font-['Epilogue',sans-serif] font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all shrink-0"
                >
                  <span>🧹 Desocupar / Liberar Mesa</span>
                </button>
              </div>
            )}

            {(currentTableOrder.status === 'PENDING' || currentTableOrder.status === 'PREPARING') && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Comanda en preparación en cocina/barra. Puedes sumar más platos a la comanda.</span>
                </div>
                <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full uppercase shrink-0">
                  {currentTableOrder.status === 'PENDING' ? 'En Cola' : 'Cocinando'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Buscador de Platos */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ceviche, parihuela, arroz, leche de tigre..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f37023] shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pestañas de Categorías - Visibles y adaptables sin cortes */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 font-['Epilogue',sans-serif] flex items-center gap-1.5 shadow-sm ${
              selectedCategoryId === 'all'
                ? 'bg-[#133854] text-white shadow-sky-950/20 ring-2 ring-[#133854]/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-[#fef8f1] hover:border-amber-300'
            }`}
          >
            <span>🍽️</span>
            <span>Toda la Carta</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 font-['Epilogue',sans-serif] shadow-sm ${
                selectedCategoryId === c.id
                  ? 'bg-[#133854] text-white shadow-sky-950/20 ring-2 ring-[#133854]/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-[#fef8f1] hover:border-amber-300'
              }`}
            >
              <span className="text-sm">{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Listado de Platos Cevecheros Estilo Tarjetas Stitch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredProducts.map((product) => {
            const isAvailable = product.isAvailableInBranch;
            const currentSpice = cardSpiceMap[product.id] || 'MEDIO';
            const countInCart = getProductCartCount(product.id);
            const imageUrl = getProductImage(product);

            return (
              <div
                key={product.id}
                className={`bg-white rounded-3xl border overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                  isAvailable
                    ? 'border-slate-200 hover:border-sky-400 hover:shadow-md'
                    : 'border-slate-200 bg-slate-50/80 opacity-75'
                }`}
              >
                {/* Imagen del plato con tag de frescura */}
                <div className="relative w-full h-36 sm:h-44 bg-slate-100 overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Badge superior */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    {product.spiceAllowed && (
                      <span className="bg-[#133854]/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3 text-[#f37023]" />
                        <span>Picante a gusto</span>
                      </span>
                    )}
                    {isAvailable && (
                      <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        Pesca del Día
                      </span>
                    )}
                  </div>

                  {/* Precio sobre la imagen */}
                  <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-sm text-[#133854] font-['Epilogue',sans-serif] font-black text-sm px-2.5 py-1 rounded-xl shadow-md border border-slate-100">
                    S/ {product.effectivePrice.toFixed(2)}
                  </div>
                </div>

                {/* Contenido informativo */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-['Epilogue',sans-serif] font-black text-slate-900 text-sm sm:text-base leading-snug">
                      {product.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Alerta de no disponible si fue bloqueado en esta sede */}
                    {!isAvailable && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{product.outOfStockReason || 'Agotado en este local hoy'}</span>
                      </div>
                    )}

                    {/* Selector rápido de picante en la tarjeta */}
                    {isAvailable && product.spiceAllowed && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          Nivel de Ají Limo:
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { id: 'SIN_AJI', label: 'Sin Ají' },
                            { id: 'MEDIO', label: 'Medio' },
                            { id: 'BRAVO', label: 'Bravo 🔥' },
                            { id: 'FUEGO', label: 'Fuego 🌶️' }
                          ].map((sp) => (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => {
                                setCardSpiceMap((prev) => ({
                                  ...prev,
                                  [product.id]: sp.id as SpiceLevel
                                }));
                              }}
                              className={`py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                currentSpice === sp.id
                                  ? 'bg-[#f37023] text-white border-[#f37023] shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {sp.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCustomization(product)}
                      disabled={!isAvailable}
                      className="text-slate-500 hover:text-[#133854] text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Elegir guarniciones o notas especiales"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Guarnición</span>
                    </button>

                    {isAvailable ? (
                      countInCart > 0 ? (
                        <div className="flex items-center gap-2 bg-[#fef8f1] border border-[#f37023]/40 rounded-xl p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleQuickDecrease(product.id)}
                            className="w-7 h-7 rounded-lg bg-white text-slate-700 font-black flex items-center justify-center hover:bg-slate-100 border border-slate-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-['Epilogue',sans-serif] font-black text-sm text-[#133854] px-1">
                            {countInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(product)}
                            className="w-7 h-7 rounded-lg bg-[#f37023] text-white font-black flex items-center justify-center hover:bg-[#ff6f00]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          className="bg-[#f37023] hover:bg-[#ff6f00] text-white font-['Epilogue',sans-serif] font-black text-xs px-3.5 py-2 rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all transform active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">No disponible</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen de platos previos si la mesa ya tiene consumo */}
        {currentTableOrder && (
          <div className="mt-8 bg-sky-50 border border-sky-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-['Epilogue',sans-serif] font-bold text-[#133854] text-xs sm:text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Platos previamente ordenados en Mesa {selectedTable}:</span>
              </h4>
              <span className="text-xs font-black text-[#f37023] bg-white px-2.5 py-1 rounded-xl border border-sky-100 shadow-sm">
                Total acumulado: S/ {currentTableOrder.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="divide-y divide-sky-100 text-xs text-slate-700">
              {currentTableOrder.items.map((it) => (
                <div key={it.id} className="py-2.5 flex justify-between items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-[#133854] font-black">{it.quantity}x</strong>
                      <span className="font-bold text-slate-900">{it.productName}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          it.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400 font-black'
                            : it.status === 'DELIVERED'
                            ? 'bg-purple-100 text-purple-800'
                            : it.status === 'PREPARING'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {it.status === 'READY'
                          ? 'Listo en Barra/Cocina'
                          : it.status === 'DELIVERED'
                          ? 'Servido'
                          : it.status === 'PREPARING'
                          ? 'En Preparación'
                          : 'Pendiente'}
                      </span>
                    </div>
                    {it.spiceLevel && (
                      <span className="text-[10px] text-[#f37023] font-bold block mt-0.5">
                        Ají: {it.spiceLevel}
                      </span>
                    )}
                    {it.notes && (
                      <span className="text-[10px] text-slate-500 italic block">
                        "{it.notes}"
                      </span>
                    )}
                  </div>
                  <span className="font-['Epilogue',sans-serif] font-black text-slate-900 shrink-0">
                    S/ {it.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {currentTableOrder.status === 'DELIVERED' && (
              <div className="mt-4 pt-3 border-t border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 p-3.5 rounded-2xl border border-sky-200">
                <div>
                  <span className="text-xs font-['Epilogue',sans-serif] font-black text-[#133854] block">
                    ¿Los comensales solicitaron la cuenta?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Revisa el resumen de consumo y realiza el cobro directamente aquí.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenBillingModal(currentTableOrder)}
                  className="w-full sm:w-auto bg-[#fc772a] hover:bg-[#e05e16] active:scale-95 text-white font-['Epilogue',sans-serif] font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all shrink-0"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Cobrar Cuenta (S/ {currentTableOrder.totalAmount.toFixed(2)})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BARRA FLOTANTE DE COMANDA (ESTILO STITCH) */}
      {cart.length > 0 && (
        <aside aria-label="Resumen de comanda actual" className="fixed bottom-16 left-0 right-0 p-3 z-30 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto bg-[#133854] text-white rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 border border-sky-800">
            <div>
              <span className="text-[11px] text-sky-200 font-bold block uppercase tracking-wider">
                Comanda Mesa {selectedTable} ({totalCartItemsCount} platos)
              </span>
              <span className="font-['Epilogue',sans-serif] text-xl font-black text-white">
                S/ {totalCartAmount.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-[#f37023] hover:bg-[#ff6f00] active:scale-95 text-white font-['Epilogue',sans-serif] font-black text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all"
            >
              <span>Ver Pedido 🛒</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
                {totalCartItemsCount}
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR (ESTILO APP STITCH) */}
      <nav aria-label="Navegación inferior móvil" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-20 py-2 px-4 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center text-xs">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="py-1 text-[#f37023] font-bold flex flex-col items-center gap-0.5"
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[10px]">Carta</span>
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="py-1 text-slate-500 hover:text-slate-900 font-bold flex flex-col items-center gap-0.5 relative"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px]">Pedido</span>
            {totalCartItemsCount > 0 && (
              <span className="absolute top-0 right-6 bg-[#f37023] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartItemsCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => {
              if (cart.length > 0 && !confirm('¿Cambiar de mesa? Hay productos no enviados.')) return;
              setSelectedTable(null);
            }}
            className="py-1 text-slate-500 hover:text-slate-900 font-bold flex flex-col items-center gap-0.5"
          >
            <Waves className="w-5 h-5" />
            <span className="text-[10px]">Mesas</span>
          </button>
          <div className="py-1 text-slate-400 font-bold flex flex-col items-center gap-0.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-black">
              {user?.name.charAt(0) || 'M'}
            </span>
            <span className="text-[10px] truncate max-w-[65px]">{user?.name}</span>
          </div>
        </div>
      </nav>

      {/* MODAL: PERSONALIZADOR DE PLATO (PICANTE, GUARNICIONES, NOTAS) */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-['Epilogue',sans-serif] font-black text-lg text-slate-900">
                  {customizingProduct.name}
                </h3>
                <span className="font-['Epilogue',sans-serif] font-extrabold text-[#f37023] text-base">
                  S/ {customizingProduct.effectivePrice.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cantidad */}
            <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between mb-4 border border-slate-100">
              <span className="text-xs font-bold text-slate-700">Cantidad:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center shadow-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-['Epilogue',sans-serif] text-base font-black text-slate-900 w-6 text-center">
                  {customQty}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomQty(customQty + 1)}
                  className="w-8 h-8 rounded-full bg-[#f37023] text-white font-bold flex items-center justify-center shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Nivel de Picante */}
            {customizingProduct.spiceAllowed && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>Nivel de Ají Limo (Picante):</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'SIN_AJI', label: 'Sin Ají', icon: '🚫' },
                    { id: 'MEDIO', label: 'Medio', icon: '🌶️' },
                    { id: 'BRAVO', label: 'Bravo', icon: '🌶️🌶️' },
                    { id: 'FUEGO', label: 'Fuego', icon: '🔥' }
                  ].map((spice) => (
                    <button
                      key={spice.id}
                      type="button"
                      onClick={() => setCustomSpice(spice.id as SpiceLevel)}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        customSpice === spice.id
                          ? 'bg-[#f37023] text-white font-bold border-[#f37023] shadow-md shadow-orange-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs">{spice.icon}</span>
                      <span className="text-[10px] block leading-tight font-bold">{spice.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Guarniciones */}
            {customizingProduct.sidesAllowed.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Guarnición o Acompañamiento:
                </label>
                <div className="flex flex-wrap gap-2">
                  {customizingProduct.sidesAllowed.map((side) => {
                    const isSelected = customSides.includes(side);
                    return (
                      <button
                        key={side}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setCustomSides(customSides.filter((s) => s !== side));
                          } else {
                            setCustomSides([...customSides, side]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-sky-100 border-sky-400 text-sky-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {side}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Observaciones para Cocina */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nota especial para Cocina:
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ej. Poco culantro, cebolla bien lavada, al centro..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f37023]"
              />
            </div>

            {/* Botón Confirmar */}
            <button
              onClick={handleAddCustomizedToCart}
              className="w-full bg-[#f37023] hover:bg-[#ff6f00] text-white font-['Epilogue',sans-serif] font-black py-3 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
            >
              <span>Agregar a la comanda</span>
              <span>•</span>
              <span>S/ {(customizingProduct.effectivePrice * customQty).toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL: REVISAR COMANDA Y ENVIAR A COCINA */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-['Epilogue',sans-serif] font-black text-lg text-slate-900">
                  Comanda para Mesa {selectedTable}
                </h3>
                <p className="text-xs text-slate-500">
                  {currentBranch?.name} • Mozo: {user?.name}
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de platos en comanda */}
            <div className="flex-1 overflow-y-auto py-3 divide-y divide-slate-100 space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No hay platos agregados a esta comanda.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Epilogue',sans-serif] font-black text-[#f37023] text-sm">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {item.product.name}
                        </span>
                      </div>

                      {item.spiceLevel && (
                        <span className="inline-block mt-0.5 text-[10px] font-black text-[#f37023] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 mr-1">
                          Ají: {item.spiceLevel}
                        </span>
                      )}

                      {item.selectedSides.length > 0 && (
                        <span className="text-[10px] text-slate-500 block">
                          Guarnición: {item.selectedSides.join(', ')}
                        </span>
                      )}

                      {item.notes && (
                        <span className="text-[10px] text-[#133854] bg-sky-50 px-1.5 py-0.5 rounded block mt-0.5 italic">
                          "{item.notes}"
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-['Epilogue',sans-serif] font-black text-slate-900 text-sm">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-rose-400 hover:text-rose-600 p-1"
                        title="Eliminar plato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Notas globales de la mesa */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota general para esta comanda:
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ej. Sacar primero las entradas frías, luego los platos calientes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f37023] mb-3"
                />

                <div className="flex items-center justify-between text-base font-black text-slate-900 mb-4">
                  <span>Total Comanda:</span>
                  <span className="font-['Epilogue',sans-serif] text-2xl text-[#f37023]">
                    S/ {totalCartAmount.toFixed(2)}
                  </span>
                </div>

                {/* Botón Enviar comanda a cocina */}
                <button
                  disabled={isSubmitting || cart.length === 0}
                  onClick={handleSendOrder}
                  className="w-full bg-gradient-to-r from-[#f37023] to-[#ff6f00] hover:from-[#ff6f00] hover:to-[#e65100] disabled:opacity-50 text-white font-['Epilogue',sans-serif] font-black py-3.5 rounded-2xl shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 text-base transition-all transform active:scale-95"
                >
                  {isSubmitting ? (
                    <span>Enviando comanda a cocina...</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>ENVIAR COMANDA A COCINA 🚀</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALES DE COBRO Y COMPROBANTE (COMPARTIDOS) */}
      {renderBillingAndReceiptModals()}
    </div>
  );
};

