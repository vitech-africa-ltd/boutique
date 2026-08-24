import React, { useState, useEffect, FC } from 'react';
import { Download, Check, Monitor, Smartphone, DownloadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const InstallPWA: FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success('Système V&I ERP installé avec succès !');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  if (isInstalled) return (
    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
      <Check className="w-4 h-4 text-emerald-500" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Version Bureau</span>
        <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-tight mt-0.5">Application Installée</span>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isInstallable && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/20 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DownloadCloud className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase text-foreground tracking-tight leading-tight">Installer le Système</span>
                <span className="text-[9px] text-muted-foreground font-medium mt-0.5">Accès ultra-rapide et support hors-ligne complet sans navigateur.</span>
              </div>
            </div>
            <Button 
              onClick={handleInstallClick}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-[0.1em] rounded-xl shadow-lg shadow-primary/20 group"
            >
              <Download className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" />
              Installer Maintenant
            </Button>
          </div>
          
          <div className="flex items-center justify-between px-2 opacity-50">
             <div className="flex items-center gap-1.5">
               <Monitor className="w-3 h-3" />
               <span className="text-[8px] font-bold uppercase">Windows/Mac</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-border" />
             <div className="flex items-center gap-1.5">
               <Smartphone className="w-3 h-3" />
               <span className="text-[8px] font-bold uppercase">Android/iOS</span>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
