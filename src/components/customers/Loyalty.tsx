import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Gift, TrendingUp, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/src/types';

export function Loyalty({ customers }: { customers: Customer[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const topCustomers = [...customers].sort((a, b) => b.loyaltyPoints - a.loyaltyPoints).slice(0, 5);
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Programme de Fidélité</h2>
          <p className="text-sm text-muted-foreground">Récompensez vos clients fidèles et boostez vos ventes.</p>
        </div>
        <Button className="gap-2 bg-[#FFB300] hover:bg-[#E6A100] text-black font-bold">
          <Gift className="w-4 h-4" />
          Configurer les Récompenses
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="bg-[#1F2125] border-border">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Points Totaux Distribués</span>
                  <Star className="w-4 h-4 text-[#FFB300]" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {customers.reduce((acc, c) => acc + c.loyaltyPoints, 0).toLocaleString('fr-FR')} pts
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1F2125] border-border">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Clients Actifs</span>
                  <Users className="w-4 h-4 text-[#00A3FF]" />
                </div>
                <div className="text-2xl font-bold text-white">{customers.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                className="pl-10 bg-[#1F2125] border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
              <Table>
                <TableHeader className="bg-[#151619]">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Client</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Points</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Rang</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                      <TableCell className="px-6 py-4">
                        <span className="text-[13px] font-medium text-white">{customer.name}</span>
                      </TableCell>
                      <TableCell className="text-center px-6 py-4">
                        <span className="text-[13px] font-bold text-[#FFB300]">{customer.loyaltyPoints}</span>
                      </TableCell>
                      <TableCell className="text-center px-6 py-4">
                        {customer.loyaltyPoints > 100 ? (
                          <Badge className="bg-[#FFB300]/20 text-[#FFB300] border-none text-[10px]">GOLD</Badge>
                        ) : customer.loyaltyPoints > 50 ? (
                          <Badge className="bg-[#C0C0C0]/20 text-[#C0C0C0] border-none text-[10px]">SILVER</Badge>
                        ) : (
                          <Badge className="bg-white/10 text-muted-foreground border-none text-[10px]">BRONZE</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <Button size="sm" variant="ghost" className="h-8 text-[11px] text-[#00A3FF] hover:bg-[#00A3FF]/10">
                          Offrir Points
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1F2125] border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#FFB300]" />
                Top Ambassadeurs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {topCustomers.map((c, i) => (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground w-4">#{i+1}</span>
                      <span className="text-[12px] text-white font-medium">{c.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#FFB300]">{c.loyaltyPoints} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#00A3FF]/5 border-[#00A3FF]/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-[#00A3FF] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#00A3FF] mb-1">Impact Fidélité</h4>
                  <p className="text-[11px] text-[#00A3FF]/80 leading-relaxed">
                    Les clients du programme de fidélité dépensent en moyenne 25% de plus par panier.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
