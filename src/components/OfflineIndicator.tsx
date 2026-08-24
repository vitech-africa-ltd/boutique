import React, { useState, useEffect, FC } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSyncing, setShowSyncing] = useState(false);
  const [showReady, setShowReady] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowSyncing(true);
      // Simulate sync process
      setTimeout(() => {
        setShowSyncing(false);
        setShowReady(true);
        setTimeout(() => setShowReady(false), 3000);
      }, 2000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setShowReady(false);
      setShowSyncing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        {isOffline && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
          >
            <div className="bg-destructive/95 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl border border-destructive/20 ring-4 ring-destructive/10">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <WifiOff className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Accès Hors-Ligne Actif</span>
                <span className="text-[9px] font-bold opacity-80 mt-1 uppercase tracking-tighter">Données sécurisées en local • Cloud en attente</span>
              </div>
            </div>
          </motion.div>
        )}

        {showSyncing && (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
          >
            <div className="bg-[#00A3FF]/95 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl border border-[#00A3FF]/20 ring-4 ring-[#00A3FF]/10">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Synchronisation Intelligente</span>
                <span className="text-[9px] font-bold opacity-80 mt-1 uppercase tracking-tighter">Mise à jour automatique des serveurs pro...</span>
              </div>
            </div>
          </motion.div>
        )}

        {showReady && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
          >
            <div className="bg-emerald-500/95 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl border border-emerald-500/20 ring-4 ring-emerald-500/10">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Système Synchronisé</span>
                <span className="text-[9px] font-bold opacity-80 mt-1 uppercase tracking-tighter">Infrastructure Cloud à jour • Connexion Optimale</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
