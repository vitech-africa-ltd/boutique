import React from 'react';
import { useERP } from '@/src/lib/useERP';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Lightbulb, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CurrencyIntelligence() {
  const { settings, refreshExchangeRates } = useERP();
  const insight = settings.aiInsight;

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'high': return 'text-[#FF4D4D] bg-[#FF4D4D]/10';
      case 'medium': return 'text-[#FFD700] bg-[#FFD700]/10';
      case 'low': return 'text-[#00E676] bg-[#00E676]/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-[#00E676]" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-[#FF4D4D]" />;
      default: return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><RefreshCw className="w-4 h-4 text-[#00A3FF]" /></motion.div>;
    }
  };

  return (
    <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-black tracking-tighter uppercase">Intelligence de Change</CardTitle>
              <CardDescription className="text-[10px]">Analyse stratégique propulsée par IA</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] font-bold gap-2"
            onClick={() => refreshExchangeRates(true)}
          >
            <RefreshCw className="w-3 h-3" />
            Recalculer
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        <AnimatePresence mode="wait">
          {insight ? (
            <motion.div 
              key="insight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-xl border border-white/5 ${getRiskColor(insight.riskLevel)}`}>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Niveau de Risque</p>
                  <div className="flex items-center gap-2 font-black text-xs">
                    {insight.riskLevel === 'high' ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {insight.riskLevel.toUpperCase()}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-muted/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Tendance</p>
                  <div className="flex items-center gap-2 font-black text-xs capitalize">
                    {getTrendIcon(insight.trend)}
                    {insight.trend === 'up' ? 'Haussière' : insight.trend === 'down' ? 'Baissière' : 'Stable'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:scale-110 transition-transform">
                    <Lightbulb className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="text-xs font-black text-primary uppercase tracking-tight mb-2 flex items-center gap-2">
                    {insight.title}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-muted-foreground font-medium italic">
                    "{insight.analysis}"
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pl-1">Actions Recommandées</p>
                  <div className="p-3 bg-[#00E676]/10 rounded-xl border border-[#00E676]/20">
                    <p className="text-[11px] text-[#00E676] font-bold">
                      {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/10">
                <p className="text-[8px] text-center text-muted-foreground uppercase font-medium">
                  Dernière analyse effectuée le {new Date(insight.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="no-insight"
              className="flex flex-col items-center justify-center py-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">Initialisation de l'intelligence artificielle...</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Analyse des flux financiers et des taux internationaux.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
