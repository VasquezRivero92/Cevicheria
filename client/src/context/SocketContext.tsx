import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';
import { soundManager } from '../utils/sound.js';
import { Order } from '../types.js';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  soundEnabled: boolean;
  toggleSound: () => void;
  lastOrderEvent: { type: string; payload: any; timestamp: number } | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, currentBranch } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastOrderEvent, setLastOrderEvent] = useState<{ type: string; payload: any; timestamp: number } | null>(null);

  useEffect(() => {
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      console.log('⚡ Conectado al servidor de WebSockets');
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('❌ Desconectado de WebSockets');
      setIsConnected(false);
    });

    s.on('order:created', (order: Order) => {
      console.log('🔔 Nuevo pedido recibido:', order);
      soundManager.playNewOrderSound();
      setLastOrderEvent({ type: 'order:created', payload: order, timestamp: Date.now() });
    });

    s.on('order:status_updated', (order: Order) => {
      console.log('🔄 Estado de pedido actualizado:', order);
      if (order.status === 'READY') {
        soundManager.playOrderReadySound();
      }
      setLastOrderEvent({ type: 'order:status_updated', payload: order, timestamp: Date.now() });
    });

    s.on('order:item_status_updated', (data: any) => {
      console.log('🥘 Plato actualizado en cocina:', data);
      setLastOrderEvent({ type: 'order:item_status_updated', payload: data, timestamp: Date.now() });
    });

    s.on('catalog:availability_changed', (data: any) => {
      console.log('📋 Cambio de disponibilidad en carta:', data);
      setLastOrderEvent({ type: 'catalog:availability_changed', payload: data, timestamp: Date.now() });
    });

    s.on('catalog:product_created', (data: any) => {
      console.log('✨ Nuevo plato agregado a la carta:', data);
      setLastOrderEvent({ type: 'catalog:product_created', payload: data, timestamp: Date.now() });
    });

    s.on('catalog:product_updated', (data: any) => {
      console.log('✏️ Plato actualizado en la carta:', data);
      setLastOrderEvent({ type: 'catalog:product_updated', payload: data, timestamp: Date.now() });
    });

    s.on('catalog:product_deleted', (data: any) => {
      console.log('🗑️ Plato retirado de la carta:', data);
      setLastOrderEvent({ type: 'catalog:product_deleted', payload: data, timestamp: Date.now() });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Unirse a las salas del local cuando cambie la sede o el usuario
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (currentBranch) {
      socket.emit('join:branch', currentBranch.id);
    }
    if (user?.role === 'admin_general' || user?.role === 'admin_local') {
      socket.emit('join:admin');
    }
  }, [socket, isConnected, currentBranch?.id, user?.role]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        soundEnabled,
        toggleSound,
        lastOrderEvent
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket debe usarse dentro de SocketProvider');
  return context;
};
