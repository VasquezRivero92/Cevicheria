import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { BranchStats, Order, BranchProductView, Category, User, Role } from '../../types.js';
import { 
  Building2, 
  TrendingUp, 
  ShoppingBag, 
  Check, 
  X, 
  Database, 
  RefreshCw,
  Search,
  DollarSign,
  Users,
  UserPlus,
  Lock,
  KeyRound,
  Pencil
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, branches, userBranches, currentBranch } = useAuth();
  const { lastOrderEvent } = useSocket();

  const isGeneralAdmin = user?.role === 'admin_general';

  // Sede inicial seleccionada: sede actual si está permitida o la primera permitida
  const initialBranchId = currentBranch?.id && userBranches.some(b => b.id === currentBranch.id)
    ? currentBranch.id
    : (userBranches[0]?.id || branches[0]?.id || '');

  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);

  const [activeTab, setActiveTab] = useState<'matrix' | 'staff' | 'overview' | 'orders' | 'firebase'>('matrix');
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [globalStats, setGlobalStats] = useState<{
    branchesCount: number;
    activeOrdersCount: number;
    totalSalesToday: number;
  }>({ branchesCount: 0, activeOrdersCount: 0, totalSalesToday: 0 });

  // Datos para la matriz de carta
  const [categories, setCategories] = useState<Category[]>([]);
  const [branchProducts, setBranchProducts] = useState<BranchProductView[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Historial de pedidos
  const [ordersHistory, setOrdersHistory] = useState<Order[]>([]);

  // Personal / Meseros
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffUsername, setNewStaffUsername] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<Role>('mozo');
  const [newStaffPin, setNewStaffPin] = useState<string>('');
  const [newStaffBranchIds, setNewStaffBranchIds] = useState<string[]>([initialBranchId]);
  const [newStaffActive, setNewStaffActive] = useState<boolean>(true);
  const [isSavingStaff, setIsSavingStaff] = useState<boolean>(false);

  // Sincronizar selectedBranchId cuando cambie userBranches o currentBranch
  useEffect(() => {
    if (currentBranch?.id && userBranches.some(b => b.id === currentBranch.id)) {
      setSelectedBranchId(currentBranch.id);
    } else if (userBranches.length > 0 && !userBranches.some(b => b.id === selectedBranchId)) {
      setSelectedBranchId(userBranches[0].id);
    }
  }, [currentBranch?.id, userBranches]);

  // Al abrir el modal para nuevo personal, seleccionar la sede activa por defecto
  useEffect(() => {
    if (selectedBranchId && isStaffModalOpen && !editingUser) {
      setNewStaffBranchIds([selectedBranchId]);
    }
  }, [selectedBranchId, isStaffModalOpen, editingUser]);

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const res = await fetch('/api/branches/stats/global');
      if (res.ok) {
        const data = await res.json();
        setGlobalStats({
          branchesCount: data.branchesCount,
          activeOrdersCount: data.activeOrdersCount,
          totalSalesToday: data.totalSalesToday
        });
        setBranchStats(data.topBranches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar productos para la sede seleccionada en la matriz
  const loadBranchProducts = async (branchId: string) => {
    if (!branchId) return;
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch('/api/catalog/categories'),
        fetch(`/api/catalog/branch/${branchId}`)
      ]);
      if (catsRes.ok && prodsRes.ok) {
        const cats = await catsRes.json();
        const prods = await prodsRes.json();
        setCategories(cats);
        setBranchProducts(prods);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar pedidos históricos
  const loadOrdersHistory = async () => {
    try {
      const query = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
      const res = await fetch(`/api/orders${query}`);
      if (res.ok) {
        const data = await res.json();
        setOrdersHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar lista de usuarios/personal
  const loadStaff = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data: User[] = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
    loadOrdersHistory();
    loadStaff();
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) {
      loadBranchProducts(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Escuchar eventos en tiempo real
  useEffect(() => {
    if (!lastOrderEvent) return;
    loadStats();
    loadOrdersHistory();
    if (lastOrderEvent.type === 'catalog:availability_changed') {
      if (selectedBranchId) {
        loadBranchProducts(selectedBranchId);
      }
    }
  }, [lastOrderEvent]);

  // Modificar disponibilidad de un plato para la sede seleccionada
  const handleToggleProductAvailability = async (
    productId: string,
    currentAvailability: boolean,
    productName: string
  ) => {
    if (!selectedBranchId) return;
    setIsUpdating(true);

    const nextAvailability = !currentAvailability;
    let reason = '';
    if (!nextAvailability) {
      reason = prompt(`Motivo de agotado para "${productName}" en esta sede:`, 'Pesca fresca agotada hoy') || 'No disponible hoy';
    }

    try {
      const res = await fetch('/api/catalog/branch-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          productId,
          isAvailable: nextAvailability,
          outOfStockReason: reason
        })
      });

      if (res.ok) {
        setBranchProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, isAvailableInBranch: nextAvailability, outOfStockReason: reason }
              : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Abrir modal para crear personal
  const handleOpenCreateStaff = () => {
    setEditingUser(null);
    setNewStaffName('');
    setNewStaffUsername('');
    setNewStaffRole('mozo');
    setNewStaffPin('');
    setNewStaffBranchIds([selectedBranchId || branches[0]?.id || '']);
    setNewStaffActive(true);
    setIsStaffModalOpen(true);
  };

  // Abrir modal para editar personal existente
  const handleOpenEditStaff = (st: User) => {
    setEditingUser(st);
    setNewStaffName(st.name);
    setNewStaffUsername(st.username);
    setNewStaffRole(st.role);
    setNewStaffPin(st.pin || '');
    const userBIds = st.branchIds && st.branchIds.length > 0 
      ? st.branchIds 
      : (st.branchId ? [st.branchId] : [selectedBranchId]);
    setNewStaffBranchIds(userBIds);
    setNewStaffActive(st.active !== false);
    setIsStaffModalOpen(true);
  };

  // Guardar (crear o actualizar) personal / mesero
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffUsername.trim() || !newStaffPin.trim()) return;
    if (newStaffBranchIds.length === 0) {
      alert('Debe asignar al menos una sede.');
      return;
    }

    setIsSavingStaff(true);
    try {
      const payload = {
        name: newStaffName.trim(),
        username: newStaffUsername.trim().toLowerCase(),
        role: newStaffRole,
        branchIds: newStaffBranchIds,
        branchId: newStaffBranchIds[0],
        pin: newStaffPin.trim(),
        active: newStaffActive
      };

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await loadStaff();
        setIsStaffModalOpen(false);
        setEditingUser(null);
        alert(editingUser ? 'Personal actualizado exitosamente.' : 'Personal registrado exitosamente con sus sedes asignadas.');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Intente nuevamente'}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setIsSavingStaff(false);
    }
  };

  // Filtrado de la carta
  const filteredProducts = branchProducts.filter((p) => {
    const matchesCat = selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const activeBranchObj = branches.find((b) => b.id === selectedBranchId);

  // Filtrado de personal según la sede seleccionada (incluye personal con esa sede o con 'all')
  const filteredStaff = staffList.filter((s) => {
    if (s.branchIds?.includes('all') || s.branchId === 'all') return true;
    return s.branchIds?.includes(selectedBranchId) || s.branchId === selectedBranchId;
  });

  // Estadísticas del local activo
  const currentBranchMetric = branchStats.find((s) => s.branchId === selectedBranchId);

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-full overflow-x-hidden bg-[#fef8f1] text-[#1d1b17] p-3 sm:p-6 pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* Cabecera del Administrador Estilo Stitch */}
        <div className="bg-[#133854] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#274966]">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isGeneralAdmin ? (
                <span className="bg-[#00223a] text-[#cee5ff] text-[10px] font-['Epilogue',sans-serif] font-bold px-3 py-1 rounded-full border border-[#274966] shadow-sm">
                  👑 Control Central Multilocal
                </span>
              ) : (
                <span className="bg-[#00223a] text-[#cee5ff] text-[10px] font-['Epilogue',sans-serif] font-bold px-3 py-1 rounded-full border border-[#274966] flex items-center gap-1 shadow-sm">
                  <Lock className="w-3 h-3 text-[#fc772a]" />
                  🏢 Administrador {userBranches.length > 1 ? `(${userBranches.length} Sedes Asignadas)` : `: ${activeBranchObj?.name}`}
                </span>
              )}
              <span className="text-xs text-[#80a2c2] font-medium">
                {isGeneralAdmin ? `${branches.length} Sedes Registradas` : `${userBranches.length} Sede(s) Bajo Tu Gestión`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-['Epilogue',sans-serif] font-black text-white tracking-tight">
              {isGeneralAdmin ? 'Administración General de Cevichería' : `Panel de Sede: ${activeBranchObj?.name}`}
            </h1>
            <p className="text-[#80a2c2] text-xs sm:text-sm mt-1">
              {isGeneralAdmin
                ? 'Supervisión consolidada de ventas, control multilocal y personal de todas las sedes.'
                : 'Control de ventas, meseros y disponibilidad de platos frescos de tus sedes asignadas.'}
            </p>
          </div>

          {/* Indicador de Sede en Gestión Activa (Sincronizado con la barra superior) */}
          <div className="bg-[#00223a]/80 px-4 py-3 rounded-2xl border border-[#274966] shadow-inner flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#133854] border border-[#fc772a]/40 flex items-center justify-center text-[#fc772a] shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-['Epilogue',sans-serif] font-bold text-[#80a2c2] uppercase tracking-wider">
                  Sede en Gestión:
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="font-['Epilogue',sans-serif] font-black text-sm sm:text-base text-[#ffdbcc] block leading-tight mt-0.5">
                {activeBranchObj?.name || 'Sede Principal'}
              </span>
              <p className="text-[10px] text-[#80a2c2] mt-0.5">
                {userBranches.length > 1 ? 'Alterna de local desde el selector superior 📍' : 'Sede asignada'}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards Estilo Stitch */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-3xl border border-[#133854]/10 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-['Epilogue',sans-serif] font-bold text-[#73777e] uppercase tracking-wide">
                {isGeneralAdmin ? 'Ventas Totales Hoy' : `Ventas Hoy (${activeBranchObj?.code})`}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#fff7ed] text-[#fc772a] flex items-center justify-center border border-[#ffedd5]">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-['Epilogue',sans-serif] font-black text-[#00223a] block mt-2">
              S/ {(isGeneralAdmin ? globalStats.totalSalesToday : (currentBranchMetric?.totalSales || 0)).toFixed(2)}
            </span>
            <span className="text-xs text-[#fc772a] font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Facturado y cobrado en caja
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-[#133854]/10 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-['Epilogue',sans-serif] font-bold text-[#73777e] uppercase tracking-wide">
                {isGeneralAdmin ? 'Comandas en Atención' : 'Comandas Activas en Sede'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center border border-[#bae6fd]">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-['Epilogue',sans-serif] font-black text-[#00223a] block mt-2">
              {isGeneralAdmin ? globalStats.activeOrdersCount : (currentBranchMetric?.activeOrdersCount || 0)}
            </span>
            <span className="text-xs text-[#0284c7] font-semibold mt-1">
              En preparación de cocina o salón
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-[#133854]/10 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-['Epilogue',sans-serif] font-bold text-[#73777e] uppercase tracking-wide">
                {isGeneralAdmin ? 'Sedes Operativas' : 'Mesas Ocupadas'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#f3ede6] text-[#133854] flex items-center justify-center border border-[#133854]/10">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-['Epilogue',sans-serif] font-black text-[#00223a] block mt-2">
              {isGeneralAdmin
                ? globalStats.branchesCount
                : `${currentBranchMetric?.tablesOccupied || 0} / ${currentBranchMetric?.tableCapacity || 12}`}
            </span>
            <span className="text-xs text-[#133854] font-semibold mt-1">
              {isGeneralAdmin ? 'Locales interconectados' : 'Capacidad de atención salón'}
            </span>
          </div>
        </div>

        {/* Pestañas del Administrador Estilo Stitch */}
        <div className="flex bg-[#f3ede6] p-1.5 rounded-full border border-[#133854]/10 mb-6 gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-2 px-4 text-xs font-bold transition-all shrink-0 flex items-center gap-2 rounded-full ${
              activeTab === 'matrix'
                ? 'bg-[#00223a] text-white font-[\'Epilogue\',sans-serif] shadow-sm'
                : 'text-[#42474d] hover:bg-[#ede7e0]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#fc772a]" />
            <span>Matriz de Carta (Activar / Desactivar)</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`py-2 px-4 text-xs font-bold transition-all shrink-0 flex items-center gap-2 rounded-full ${
              activeTab === 'staff'
                ? 'bg-[#00223a] text-white font-[\'Epilogue\',sans-serif] shadow-sm'
                : 'text-[#42474d] hover:bg-[#ede7e0]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#fc772a]" />
            <span>Personal & Meseros (Multisede)</span>
          </button>

          {isGeneralAdmin && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-4 text-xs font-bold transition-all shrink-0 flex items-center gap-2 rounded-full ${
                activeTab === 'overview'
                  ? 'bg-[#00223a] text-white font-[\'Epilogue\',sans-serif] shadow-sm'
                  : 'text-[#42474d] hover:bg-[#ede7e0]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#fc772a]" />
              <span>Comparativo de Sedes</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 text-xs font-bold transition-all shrink-0 flex items-center gap-2 rounded-full ${
              activeTab === 'orders'
                ? 'bg-[#00223a] text-white font-[\'Epilogue\',sans-serif] shadow-sm'
                : 'text-[#42474d] hover:bg-[#ede7e0]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#fc772a]" />
            <span>Historial de Pedidos</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`py-2 px-4 text-xs font-bold transition-all shrink-0 flex items-center gap-2 rounded-full ${
              activeTab === 'firebase'
                ? 'bg-[#00223a] text-white font-[\'Epilogue\',sans-serif] shadow-sm'
                : 'text-[#42474d] hover:bg-[#ede7e0]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#fc772a]" />
            <span>Arquitectura & Firebase</span>
          </button>
        </div>

      {/* PESTAÑA 1: MATRIZ DE CARTA POR SEDE */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-cyan-950 text-sm flex items-center gap-1.5">
                <span>Disponibilidad en:</span>
                <strong className="text-cyan-800 underline">{activeBranchObj?.name}</strong>
              </h3>
              <p className="text-xs text-cyan-800/80 mt-0.5">
                Puedes desactivar platos cuando se agote la pesca fresca del día o los mariscos en esta sede. Los meseros que atiendan en este local lo verán bloqueado de inmediato.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-900 bg-white px-3 py-1.5 rounded-xl border border-cyan-200 shadow-sm">
                Total Platos: {branchProducts.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nombre de plato..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pb-1">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCategoryFilter === c.id
                      ? 'bg-[#133854] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Plato / Producto</th>
                  <th className="py-3 px-4">Precio</th>
                  <th className="py-3 px-4">Estado en esta Sede</th>
                  <th className="py-3 px-4">Motivo si está agotado</th>
                  <th className="py-3 px-4 text-right">Control de Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isAvailable = p.isAvailableInBranch;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span>{p.name}</span>
                        <span className="block text-[11px] font-normal text-slate-400 truncate max-w-xs">
                          {p.description}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-800">
                        S/ {p.effectivePrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                            <Check className="w-3 h-3" /> Habilitado para Venta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                            <X className="w-3 h-3" /> AGOTADO EN ESTE LOCAL
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 italic">
                        {!isAvailable ? (
                          <span className="text-red-600 font-medium">
                            {p.outOfStockReason || 'Agotado'}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleToggleProductAvailability(p.id, isAvailable, p.name)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                            isAvailable
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {isAvailable ? 'Marcar Agotado' : 'Habilitar Plato'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: GESTIÓN DE PERSONAL Y MESEROS POR LOCAL */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                <span>Personal y Meseros: {activeBranchObj?.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Un administrador o mesero puede estar asignado a una o más sedes (rotativos).
              </p>
            </div>

            <button
              onClick={handleOpenCreateStaff}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Personal / Mesero</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Rol en Sistema</th>
                  <th className="py-3 px-4">Sedes Asignadas</th>
                  <th className="py-3 px-4">PIN Rápido</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((st) => {
                  const getRoleLabel = (role: Role) => {
                    switch (role) {
                      case 'admin_general':
                        return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">👑 Admin General</span>;
                      case 'admin_local':
                        return <span className="bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-md">🏢 Admin de Sede</span>;
                      case 'mozo':
                        return <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">📱 Mesero / Salón</span>;
                      case 'cocina':
                        return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">👨‍🍳 Cocina / Barra</span>;
                      case 'cajero':
                        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">💵 Caja & Cobros</span>;
                    }
                  };

                  const isGlobal = st.branchIds?.includes('all') || st.branchId === 'all';
                  const assignedList = st.branchIds || (st.branchId ? [st.branchId] : []);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{st.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{st.username}</td>
                      <td className="py-3 px-4">{getRoleLabel(st.role)}</td>
                      <td className="py-3 px-4">
                        {isGlobal ? (
                          <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                            🌐 Todas las Sedes
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedList.map((bId) => {
                              const bName = branches.find((b) => b.id === bId)?.name || bId;
                              return (
                                <span
                                  key={bId}
                                  className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded-md text-[11px] border border-slate-200"
                                >
                                  {bName}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-800 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span>{st.pin}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          st.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {st.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditStaff(st)}
                          className="bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1.5"
                          title="Modificar usuario y asignación de sedes"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: COMPARATIVO DE SEDES (SOLO ADMIN GENERAL) */}
      {activeTab === 'overview' && isGeneralAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branchStats.map((st) => (
            <div key={st.branchId} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base">{st.branchName}</h3>
                  <span className="text-xs text-slate-400">Capacidad: {st.tableCapacity} mesas</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                  {st.tablesOccupied}/{st.tableCapacity}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ventas Totales:</span>
                  <span className="font-black text-emerald-600 text-sm">
                    S/ {st.totalSales.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Comandas en Atención:</span>
                  <span className="font-bold text-slate-900">{st.activeOrdersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cuentas Cobradas:</span>
                  <span className="font-bold text-slate-900">{st.completedOrdersCount}</span>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (st.tablesOccupied / (st.tableCapacity || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block text-right">
                    {Math.round((st.tablesOccupied / (st.tableCapacity || 1)) * 100)}% ocupación de salón
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PESTAÑA 4: HISTORIAL DE PEDIDOS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Historial de Comandas en {activeBranchObj?.name} ({ordersHistory.length})
            </h3>
            <button
              onClick={loadOrdersHistory}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Hora</th>
                  <th className="py-2.5 px-3">Mesa</th>
                  <th className="py-2.5 px-3">Mesero</th>
                  <th className="py-2.5 px-3">Platos</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersHistory.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-500">
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900">
                      Mesa {o.tableNumber}
                    </td>
                    <td className="py-2.5 px-3">{o.waiterName}</td>
                    <td className="py-2.5 px-3">
                      {o.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900">
                      S/ {o.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          o.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700'
                            : o.status === 'PAID'
                            ? 'bg-cyan-100 text-cyan-800'
                            : o.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'DELIVERED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.status === 'COMPLETED' ? 'LIBERADA' : o.status === 'PAID' ? 'PAGADO (OCUPADA)' : o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-600">
                      {o.paymentMethod || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 5: ARQUITECTURA & FIREBASE */}
      {activeTab === 'firebase' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Arquitectura Desacoplada y Migración a Firebase
              </h3>
              <p className="text-xs text-slate-500">
                Patrón Repositorio (Repository Pattern) implementado para escalabilidad total.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Estado Actual:
              </span>
              <div className="flex items-center gap-2 text-emerald-600 font-black text-base">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Base de Datos Local NoSQL (Activa)</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                El sistema almacena datos en documentos JSON atómicos idénticos a las colecciones de
                Google Firestore: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">branches</code>,{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">products</code>,{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">orders</code>,{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">branch_configs</code>,{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">users</code>.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                Paso a Producción en la Nube:
              </span>
              <div className="flex items-center gap-2 text-amber-900 font-black text-base">
                <span>Google Firebase Firestore</span>
              </div>
              <p className="text-xs text-amber-800/80 mt-2 leading-relaxed">
                Gracias a las interfaces <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">IBranchRepository</code>,{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">IOrderRepository</code> y la factoría
                de inyección, la migración no requiere alterar ninguna pantalla ni controlador.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR O EDITAR PERSONAL / MESERO (CON SELECCIÓN MULTISEDE) */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h4 className="font-black text-base text-slate-900">
                  {editingUser ? 'Modificar Personal / Mesero' : 'Registrar Nuevo Personal'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {editingUser
                    ? `Modifica los datos, rol o sedes asignadas de ${editingUser.name}.`
                    : 'Asigna una o más sedes donde laborará este colaborador.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsStaffModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Ej. Gabriel Morales"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de Usuario (Login):</label>
                <input
                  type="text"
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value)}
                  placeholder="Ej. mozo.gabriel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol en el Restaurante:</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as Role)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="mozo">📱 Mesero / Salón</option>
                  <option value="cocina">👨‍🍳 Cocina / Barra</option>
                  <option value="cajero">💵 Caja & Cobros</option>
                  {isGeneralAdmin && (
                    <>
                      <option value="admin_local">🏢 Administrador de Sede (Local)</option>
                      <option value="admin_general">👑 Administrador General (Multisede)</option>
                    </>
                  )}
                </select>
              </div>

              {/* ASIGNACIÓN DE SEDES (CHECKBOXES MULTISEDE) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sedes Asignadas (puede marcar más de una para meseros rotativos o admins multisede):
                </label>
                <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {(isGeneralAdmin ? branches : userBranches).map((b) => {
                    const isChecked = newStaffBranchIds.includes(b.id) || newStaffBranchIds.includes('all');
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${
                          isChecked ? 'bg-cyan-50/70 border-cyan-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStaffBranchIds([...newStaffBranchIds.filter(id => id !== 'all'), b.id]);
                            } else {
                              if (newStaffBranchIds.length > 1) {
                                setNewStaffBranchIds(newStaffBranchIds.filter((id) => id !== b.id));
                              }
                            }
                          }}
                          className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-slate-800 block text-xs">{b.name}</span>
                          <span className="text-[10px] text-slate-400">{b.address}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Código PIN de 4 dígitos:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  placeholder="Ej. 1122"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Permite ingreso rápido en la pantalla táctil o celular.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado de la Cuenta:</label>
                <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="staffActive"
                      checked={newStaffActive === true}
                      onChange={() => setNewStaffActive(true)}
                      className="text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="font-bold text-emerald-700 text-xs">Activo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="staffActive"
                      checked={newStaffActive === false}
                      onChange={() => setNewStaffActive(false)}
                      className="text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="font-bold text-rose-700 text-xs">Inactivo (Acceso bloqueado)</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingStaff}
                  className="w-full bg-[#fc772a] hover:bg-[#e05e16] text-white font-['Epilogue',sans-serif] font-bold py-3.5 rounded-2xl shadow-lg shadow-[#fc772a]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isSavingStaff
                    ? 'Guardando...'
                    : (editingUser ? 'Guardar Cambios del Usuario' : `Guardar y Asignar a ${newStaffBranchIds.length} Sede(s)`)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
