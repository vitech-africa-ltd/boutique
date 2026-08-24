import React, { useState, useEffect, FC } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Laptop, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InstallPWA: FC = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('Applet: ready for installation');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  if (!installPrompt || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)]"
      >
        <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl backdrop-blur-xl bg-opacity-90">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black uppercase tracking-wider">Installation ERP</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Installez l'application sur votre appareil pour un accès direct et une utilisation hors-ligne professionnelle.
              </p>
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  onClick={handleInstall}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-widest h-9 rounded-lg"
                >
                  <Laptop className="w-3 h-3 mr-2 hidden sm:inline" />
                  Installer maintenant
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsDismissed(true)}
                  className="text-[10px] uppercase font-bold tracking-widest h-9 rounded-lg px-3 hover:bg-muted"
                >
                  Plus tard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
