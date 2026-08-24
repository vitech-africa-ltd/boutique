import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Search, Package, Users, Receipt, ArrowRight, CornerDownLeft, Command } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Product, Customer, Sale } from '@/src/types';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  onNavigate: (tab: string) => void;
}

type ResultItem = {
  id: string;
  title: string;
  subtitle: string;
  type: 'product' | 'customer' | 'sale';
  tab: string;
};

export function GlobalSearch({ products, customers, sales, onNavigate }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults: ResultItem[] = [];
    const q = query.toLowerCase();

    // Search Products
    products
      .filter(p => p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(p => {
        searchResults.push({
          id: p.id,
          title: p.name,
          subtitle: `${p.reference} • ${p.category} • ${p.stock} en stock`,
          type: 'product',
          tab: 'inventory'
        });
      });

    // Search Customers
    customers
      .filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 3)
      .forEach(c => {
        searchResults.push({
          id: c.id,
          title: c.name,
          subtitle: `${c.phone} • ${c.loyaltyPoints} points`,
          type: 'customer',
          tab: 'customers'
        });
      });

    // Search Sales
    sales
      .filter(s => s.id.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(s => {
        searchResults.push({
          id: s.id,
          title: `Vente ${s.id}`,
          subtitle: `${new Date(s.date).toLocaleDateString()} • ${s.totalTTC.toLocaleString()} FCFA`,
          type: 'sale',
          tab: 'sales-history'
        });
      });

    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, products, customers, sales]);

  const handleSelect = (item: ResultItem) => {
    onNavigate(item.tab);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-white bg-[#1F2125] border border-border rounded-lg transition-all w-64 group"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Recherche globale...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 gap-0 bg-[#151619] border-border overflow-hidden">
          <div className="flex items-center px-4 border-b border-border h-12">
            <Search className="w-4 h-4 text-muted-foreground mr-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Rechercher un produit, client ou une vente..."
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-white placeholder:text-muted-foreground/50 h-full p-0"
              autoFocus
            />
            {query && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground/50 ml-2">
                {results.length} résultats
              </Badge>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto py-2 custom-scrollbar">
            {query === '' ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                  <Command className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Recherche Multimodale</p>
                  <p className="text-xs text-muted-foreground">Recherchez instantanément dans tout l'ERP</p>
                </div>
                <div className="flex justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Package className="w-3 h-3" /> Articles
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Users className="w-3 h-3" /> Clients
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Receipt className="w-3 h-3" /> Ventes
                  </div>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Aucun résultat trouvé pour "{query}"</p>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                {results.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group animate-in fade-in slide-in-from-left-2 duration-200",
                      index === selectedIndex ? "bg-[#00A3FF]/10 text-white" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      item.type === 'product' ? "bg-orange-500/10 text-orange-500" :
                      item.type === 'customer' ? "bg-green-500/10 text-green-500" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {item.type === 'product' && <Package className="w-4 h-4" />}
                      {item.type === 'customer' && <Users className="w-4 h-4" />}
                      {item.type === 'sale' && <Receipt className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate">{item.title}</span>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter shrink-0 border-border bg-white/5 opacity-40">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] opacity-60 truncate">{item.subtitle}</p>
                    </div>
                    <div className={cn(
                      "opacity-0 transition-opacity",
                      index === selectedIndex && "opacity-100"
                    )}>
                      <CornerDownLeft className="w-3 h-3 text-[#00A3FF]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4 h-10 border-t border-border bg-[#111214] text-[10px] text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="bg-muted px-1 rounded border border-border">↑↓</kbd> Naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-muted px-1 rounded border border-border">Enter</kbd> Sélectionner
              </span>
            </div>
            <span className="flex items-center gap-1 italic">
              Esc pour fermer
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
