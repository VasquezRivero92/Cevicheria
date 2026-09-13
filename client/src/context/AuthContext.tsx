import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Branch } from '../types.js';

interface AuthContextType {
  user: User | null;
  currentBranch: Branch | null;
  branches: Branch[];
  userBranches: Branch[]; // Sedes a las que el usuario actual tiene acceso
  isLoading: boolean;
  loginWithUsername: (username: string) => Promise<boolean>;
  loginWithPin: (pin: string) => Promise<boolean>;
  setBranch: (branch: Branch) => void;
  logout: () => void;
  refreshBranches: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cevichapp_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(() => {
    const saved = localStorage.getItem('cevichapp_branch');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data: Branch[] = await res.json();
        setBranches(data);
        return data;
      }
    } catch (err) {
      console.error('Error cargando sedes:', err);
    }
    return [];
  };

  // Calcular las sedes permitidas para un usuario
  const getUserBranches = (currentUser: User | null, allBranchesList: Branch[]): Branch[] => {
    if (!currentUser || allBranchesList.length === 0) return [];

    // Admin general tiene acceso a todas las sedes
    if (
      currentUser.role === 'admin_general' ||
      currentUser.branchIds?.includes('all') ||
      currentUser.branchId === 'all'
    ) {
      return allBranchesList;
    }

    // Si tiene lista de branchIds asignados (soporta meseros y administradores con 1 o más sedes)
    if (currentUser.branchIds && currentUser.branchIds.length > 0) {
      const matched = allBranchesList.filter((b) => currentUser.branchIds.includes(b.id));
      return matched.length > 0 ? matched : allBranchesList;
    }

    // Compatibilidad si solo tiene branchId único
    if (currentUser.branchId) {
      const matched = allBranchesList.filter((b) => b.id === currentUser.branchId);
      return matched.length > 0 ? matched : allBranchesList;
    }

    return allBranchesList;
  };

  const userBranches = getUserBranches(user, branches);

  useEffect(() => {
    fetchBranches().then((branchList) => {
      setIsLoading(false);
      if (user) {
        const allowed = getUserBranches(user, branchList);
        if (allowed.length > 0) {
          const isCurrentValid = currentBranch && allowed.some((b) => b.id === currentBranch.id);
          const target = isCurrentValid ? currentBranch : allowed[0];
          setCurrentBranch(target);
          localStorage.setItem('cevichapp_branch', JSON.stringify(target));
        }
      } else if (!currentBranch && branchList.length > 0) {
        setCurrentBranch(branchList[0]);
        localStorage.setItem('cevichapp_branch', JSON.stringify(branchList[0]));
      }
    });
  }, [user?.id]);

  const handleUserSession = (loggedInUser: User, branchList: Branch[]) => {
    setUser(loggedInUser);
    localStorage.setItem('cevichapp_user', JSON.stringify(loggedInUser));

    const allowed = getUserBranches(loggedInUser, branchList);
    if (allowed.length > 0) {
      const isCurrentValid = currentBranch && allowed.some((b) => b.id === currentBranch.id);
      const target = isCurrentValid ? currentBranch : allowed[0];
      setCurrentBranch(target);
      localStorage.setItem('cevichapp_branch', JSON.stringify(target));
    }
  };

  const loginWithUsername = async (username: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (res.ok) {
        const data = await res.json();
        const branchList = branches.length > 0 ? branches : await fetchBranches();
        handleUserSession(data.user, branchList);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const loginWithPin = async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        const data = await res.json();
        const branchList = branches.length > 0 ? branches : await fetchBranches();
        handleUserSession(data.user, branchList);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const setBranch = (branch: Branch) => {
    // Verificar si el usuario tiene permiso para esta sede
    const allowed = getUserBranches(user, branches);
    const hasPermission = allowed.some((b) => b.id === branch.id);
    if (!hasPermission) {
      console.warn('El usuario no tiene asignada esta sede');
      return;
    }
    setCurrentBranch(branch);
    localStorage.setItem('cevichapp_branch', JSON.stringify(branch));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cevichapp_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentBranch,
        branches,
        userBranches,
        isLoading,
        loginWithUsername,
        loginWithPin,
        setBranch,
        logout,
        refreshBranches: async () => {
          await fetchBranches();
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
