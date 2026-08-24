import React from 'react';
import { useERP } from '@/src/lib/useERP';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { ALL_CURRENCIES } from '@/src/constants';

export function CurrencySelector() {
  const { settings, updateSettings, refreshExchangeRates } = useERP();

  const handleCurrencyChange = (code: string) => {
    const selected = ALL_CURRENCIES.find(c => c.code === code);
    if (selected) {
      updateSettings({
        ...settings,
        currency: code
      });
      // Small delay to ensure state update before fetching
      setTimeout(() => refreshExchangeRates(true), 100);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg text-primary">
        <Globe className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Devise de Gestion</p>
        <Select value={settings.currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="h-9 bg-muted/50 border-border text-[11px] font-bold">
            <SelectValue placeholder="Choisir une devise" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-[300px]">
            {ALL_CURRENCIES.map(c => (
              <SelectItem key={c.code} value={c.code} className="text-[11px] font-bold">
                {c.symbol} - {c.name} ({c.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
