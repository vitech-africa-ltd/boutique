import React, { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Lock, User, AlertCircle } from 'lucide-react';
import { User as UserType } from '@/src/types';
import { toast } from 'sonner';
import { db } from '@/src/lib/db';
import { GoogleAuthButton } from './GoogleAuthButton';

interface LoginProps {
  onLogin: (user: UserType) => void;
  onRegister: (user: UserType) => Promise<boolean>;
}

export function Login({ onLogin, onRegister }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'cashier'>('cashier');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const user = await db.users.where('username').equals(username).first();

      if (user && user.password === password) {
        onLogin(user);
        toast.success(`Bienvenue, ${user.username} !`);
      } else {
        // Fallback for demo/first install if no users exist yet
        const count = await db.users.count();
        if (count === 0 && username === 'admin' && password === 'admin') {
          const admin: UserType = { id: 'admin', username: 'admin', password: 'admin', role: 'admin' };
          await db.users.add(admin);
          onLogin(admin);
          return;
        }
        setError('Identifiants incorrects.');
      }
    } else {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }

      const newUser: UserType = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        password,
        role
      };

      const success = await onRegister(newUser);
      if (success) {
        onLogin(newUser);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0E10] p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00A3FF]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00A3FF]/5 rounded-full blur-[120px]" />

      <Card className="w-full max-w-[420px] bg-[#151619] border-border shadow-2xl relative z-10 overflow-hidden rounded-3xl border-2">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-16 h-16 bg-[#00A3FF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00A3FF]/20 animate-in zoom-in-50 duration-500">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tighter text-white uppercase italic">
              VI ERP Pro <span className="text-primary text-xs ml-1 font-black not-italic tracking-[0.3em]">AFRICA</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-xs">
              {mode === 'login' 
                ? "Identifiez-vous pour accéder à la caisse et aux stocks" 
                : "Créez votre accès professionnel local ou cloud"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Google Sign In Component */}
          <div className="space-y-2">
            <GoogleAuthButton 
              onSuccess={onLogin} 
              preferredRole={role}
              buttonText={mode === 'login' ? 'Continuer avec Google' : "S'inscrire avec Google"} 
            />
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-[#151619] px-3 text-muted-foreground/70">ou identifiants locaux</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Utilisateur</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nom d'utilisateur"
                  className="pl-10 bg-[#1F2125] border-border text-white h-12 rounded-xl focus:ring-primary/20"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Rôle Professionnel</label>
                <select 
                  className="w-full bg-[#1F2125] border border-border text-white h-12 rounded-xl px-4 text-sm font-bold appearance-none cursor-pointer focus:ring-primary/20 outline-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="cashier">Caissier / POS</option>
                  <option value="manager">Manager / Gérant</option>
                  <option value="admin">Directeur / Admin</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  className="pl-10 bg-[#1F2125] border-border text-white h-12 rounded-xl focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Confirmation</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    className="pl-10 bg-[#1F2125] border-border text-white h-12 rounded-xl focus:ring-primary/20"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FF4D4D]/10 text-[#FF4D4D] text-xs font-bold animate-in zoom-in-95 duration-200 border border-[#FF4D4D]/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest bg-[#00A3FF] hover:bg-[#0082CC] text-white shadow-lg shadow-[#00A3FF]/20 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-xs font-bold text-[#00A3FF] hover:underline uppercase tracking-wider"
            >
              {mode === 'login' 
                ? "Pas encore de compte ? S'enregistrer" 
                : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-10">
          <div className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-30">
            <p>© 2026 vab&idriss engineering</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
