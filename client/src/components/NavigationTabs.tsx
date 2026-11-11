import React from 'react';
import {
  LayoutDashboard, Cpu, GitBranch, BarChart3, Cloud
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'load-balancing', label: 'Load Balancing', icon: Cpu },
  { id: 'ada-lab', label: 'Algorithm Lab', icon: GitBranch },
  { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
  { id: 'cloud-architecture', label: 'Architecture & Models', icon: Cloud },
];

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="w-full border-b border-white/[0.06] bg-bg-primary/50 backdrop-blur-md sticky top-[57px] z-40 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto">
        <nav className="flex items-center gap-1 p-1 bg-zinc-900/60 border border-white/[0.08] rounded-xl backdrop-blur-md shadow-inner">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-md shadow-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
};
