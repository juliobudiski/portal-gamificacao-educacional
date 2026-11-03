import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * @component ConnectionStatusBadge
 * @description
 * Indicador de status de conexão em tempo real no HUD e cabeçalho (Melhoria 97).
 * Monitora o estado de conectividade do navegador (online/offline) e a estabilidade da sessão.
 */
export default function ConnectionStatusBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
        isOnline
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'
      }`}
      title={isOnline ? 'Conexão em Tempo Real Ativa' : 'Sem Conexão com o Servidor'}
    >
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
      {isOnline ? (
        <span className="hidden sm:inline">Online</span>
      ) : (
        <span className="flex items-center gap-1">
          <WifiOff size={10} /> Offline
        </span>
      )}
    </div>
  );
}
