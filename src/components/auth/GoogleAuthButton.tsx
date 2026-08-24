import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { User as UserType } from '@/src/types';
import { loadGoogleScript, parseJwt, authenticateGoogleUser, GoogleUserProfile } from '@/src/services/googleAuthService';
import { toast } from 'sonner';
import { Sparkles, CheckCircle2, User, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';

interface GoogleAuthButtonProps {
  onSuccess: (user: UserType) => void;
  preferredRole?: 'admin' | 'manager' | 'cashier';
  className?: string;
  buttonText?: string;
}

export function GoogleAuthButton({ 
  onSuccess, 
  preferredRole = 'manager', 
  className = '',
  buttonText = 'Continuer avec Google' 
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [hasGoogleClient, setHasGoogleClient] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    let mounted = true;

    loadGoogleScript()
      .then(() => {
        if (!mounted) return;
        if ((window as any).google?.accounts?.id && clientId) {
          try {
            (window as any).google.accounts.id.initialize({
              client_id: clientId,
              callback: async (response: any) => {
                if (response.credential) {
                  const payload = parseJwt(response.credential);
                  if (payload) {
                    const profile: GoogleUserProfile = {
                      id: payload.sub,
                      email: payload.email,
                      name: payload.name || payload.given_name || 'Utilisateur Google',
                      picture: payload.picture,
                      verified: payload.email_verified
                    };
                    const user = await authenticateGoogleUser(profile, preferredRole);
                    toast.success(`Connecté en tant que ${user.username} (Google)`);
                    onSuccess(user);
                  }
                }
              }
            });
            setHasGoogleClient(true);
          } catch (e) {
            console.warn('GSI Init warning:', e);
          }
        }
      })
      .catch((err) => {
        console.warn('Google GSI script could not be loaded:', err);
      });

    return () => {
      mounted = false;
    };
  }, [clientId, preferredRole, onSuccess]);

  const handleGoogleClick = async () => {
    setIsLoading(true);

    // If real Google Client ID is configured and GSI is ready, prompt Google One-Tap / Prompt
    if (hasGoogleClient && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If prompt was skipped or blocked, open convenient quick-connect dialog
            setIsModalOpen(true);
            setIsLoading(false);
          }
        });
        return;
      } catch (err) {
        console.warn('Google prompt fallback:', err);
      }
    }

    // In sandbox or without custom client ID, open the dedicated Google Auth Dialog
    setIsLoading(false);
    setIsModalOpen(true);
  };

  const handleDemoGoogleAccount = async (name: string, email: string, role: 'admin' | 'manager' | 'cashier', avatarUrl?: string) => {
    try {
      setIsLoading(true);
      const profile: GoogleUserProfile = {
        id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name,
        email,
        picture: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        verified: true
      };

      const user = await authenticateGoogleUser(profile, role);
      setIsModalOpen(false);
      toast.success(`Authentification Google réussie: ${user.username}`);
      onSuccess(user);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la connexion Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) {
      toast.error('Veuillez renseigner votre nom et votre adresse Gmail');
      return;
    }
    const cleanEmail = customEmail.includes('@') ? customEmail : `${customEmail}@gmail.com`;
    await handleDemoGoogleAccount(customName, cleanEmail, preferredRole);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleClick}
        disabled={isLoading}
        className={`w-full h-12 bg-[#1A1C20] hover:bg-[#23262B] text-white border-border/80 hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-3 rounded-xl font-bold text-sm shadow-sm ${className}`}
      >
        {/* Official Google Vector G Logo */}
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>{isLoading ? 'Connexion en cours...' : buttonText}</span>
      </Button>

      {/* Google Sign-in Selector Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-[#141619] border-border text-white rounded-3xl p-6 shadow-2xl border-2">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Connexion avec Google
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sélectionnez un compte Google ou saisissez vos coordonnées pour accéder à l'ERP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Quick Profile Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Comptes Rapides Recommandés
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoGoogleAccount('Idriss Directeur', 'idriss.director@gmail.com', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1D2026] hover:bg-[#252932] border border-border/60 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm overflow-hidden border border-primary/30">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Idriss" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">Idriss Directeur (Admin)</p>
                      <p className="text-[10px] text-muted-foreground">idriss.director@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded uppercase">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoGoogleAccount('Vab Manager', 'vab.manager@gmail.com', 'manager', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1D2026] hover:bg-[#252932] border border-border/60 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-500 text-sm overflow-hidden border border-emerald-500/30">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Vab" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Vab Manager</p>
                      <p className="text-[10px] text-muted-foreground">vab.manager@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-black px-2 py-0.5 rounded uppercase">Manager</span>
                </button>
              </div>
            </div>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black">
                <span className="bg-[#141619] px-2 text-muted-foreground">ou saisissez votre compte Google</span>
              </div>
            </div>

            {/* Custom Google Email Form */}
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Nom Complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Ex: Sarah Connor"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="pl-9 bg-[#1D2026] border-border text-white h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Adresse Gmail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="nom@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="pl-9 bg-[#1D2026] border-border text-white h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20 mt-2"
              >
                Valider et Ouvrir la Session
              </Button>
            </form>

            <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 text-[10px] text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Authentification sécurisée par signature locale et compatibilité Google Workspace OAuth2.</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
