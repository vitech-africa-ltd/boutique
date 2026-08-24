import { Sun, Moon, TreePine, Crown } from 'lucide-react';

export const THEMES = [
  {
    id: 'light',
    label: 'Clair',
    description: 'Interface lumineuse et épurée.',
    icon: Sun,
    color: 'bg-white border-gray-200',
    primary: '#00A3FF',
  },
  {
    id: 'dark',
    label: 'Sombre',
    description: 'Anthracite professionnel pour un confort nocturne.',
    icon: Moon,
    color: 'bg-[#151619] border-[#2A2D32]',
    primary: '#00A3FF',
  },
  {
    id: 'theme-nature',
    label: 'Nature',
    description: 'Accents vert émeraude inspirés par la forêt.',
    icon: TreePine,
    color: 'bg-[#1B4332] border-[#2D6A4F]',
    primary: '#40916C',
  },
  {
    id: 'theme-royal',
    label: 'Royal',
    description: 'Une touche premium aux nuances violettes.',
    icon: Crown,
    color: 'bg-[#4C1D95] border-[#6D28D9]',
    primary: '#A78BFA',
  },
] as const;

export type ThemeId = typeof THEMES[number]['id'];
