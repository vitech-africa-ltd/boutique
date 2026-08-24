import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, Construction } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function PlaceholderView({ title, description, icon: Icon = Construction }: PlaceholderViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-[#00A3FF]/10 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-[#00A3FF]" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {description}
      </p>
      <Card className="mt-10 bg-[#1F2125] border-border border-dashed max-w-lg w-full">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground italic">
            "Ce module professionnel est en cours de configuration pour votre environnement Enterprise Edition. 
            Les fonctionnalités de scan, d'analyse et de gestion avancée seront bientôt opérationnelles."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
