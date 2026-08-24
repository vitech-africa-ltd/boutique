import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, Filter, AlertTriangle, ShieldCheck, Clock, User, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AuditLogEntry } from '@/src/lib/db';

interface AuditTrailProps {
  logs: AuditLogEntry[];
}

export function AuditTrail({ logs }: AuditTrailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'DELETE': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'UPDATE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'CREATE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'REFUND': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'STOCK_ADJUSTMENT': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Journal d'Audit de Sécurité
        </h2>
        <p className="text-muted-foreground font-medium">
          Traçabilité complète et immuable de toutes les actions sensibles du système (Anti-Fraude).
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par utilisateur, action ou détail..."
            className="pl-10 bg-card/50 border-border h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           {['all', 'CREATE', 'UPDATE', 'DELETE', 'REFUND', 'STOCK_ADJUSTMENT'].map((action) => (
             <button
                key={action}
                type="button"
                onClick={() => setFilterAction(action)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                  filterAction === action 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
             >
               {action === 'all' ? 'Tous' : action.replace('_', ' ')}
             </button>
           ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Date & Heure</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Utilisateur</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Action</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Entité</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Détails de l'Opération</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest text-right">Intégrité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                  Aucun log ne correspond à vos critères.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/20 border-b border-border transition-colors group">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                       <span className="text-[12px] font-bold text-foreground">
                         {new Date(log.timestamp).toLocaleString('fr-FR')}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-[10px] text-primary">
                        {log.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-black uppercase tracking-tight">{log.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="outline" className={cn("px-2 py-0.5 text-[9px] font-black tracking-widest uppercase border", getActionStyles(log.action))}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-tighter italic">
                      {log.entityType}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="text-[13px] font-medium text-foreground/80 leading-relaxed max-w-md truncate md:whitespace-normal">
                      {log.details}
                    </p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                       <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-500 flex items-center gap-1">
                         <Shield className="w-3 h-3" />
                         VALIDE
                       </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-xl flex items-start gap-4">
         <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
         <div className="space-y-1">
            <h4 className="text-xs font-black text-destructive uppercase tracking-widest">Alerte de Sécurité Interne</h4>
            <p className="text-[11px] text-destructive/80 font-medium leading-relaxed">
              Le journal d'audit est protégé par un hachage cryptographique SHA-256. Toute tentative de modification directe de la base de données IndexedDB rendra les logs invalides, signalant immédiatement une tentative de fraude.
            </p>
         </div>
      </div>
    </div>
  );
}
