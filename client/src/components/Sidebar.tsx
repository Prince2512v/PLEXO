import React from 'react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeNodesCount?: number;
  throughputRate?: string;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview Dashboard', icon: 'hub' },
  { id: 'load-balancing', label: 'Load Balancing', icon: 'alt_route' },
  { id: 'ada-lab', label: 'ADA Algorithm Lab', icon: 'neurology' },
  { id: 'analytics', label: 'Traffic Analytics', icon: 'analytics' },
  { id: 'cloud-architecture', label: 'Architecture & Models', icon: 'account_tree' },
  { id: 'about', label: 'About Project', icon: 'info' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeNodesCount = 6,
  throughputRate = '1.42 M req/s',
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between py-6">
      <div className="flex flex-col">
        {/* Logo and Platform Title */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold font-title-md shadow-md">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-title-md text-title-md text-primary-container tracking-tight font-bold">
              PLEXO
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              Traffic Core
            </span>
          </div>
        </div>

        {/* Cluster Status Pill */}
        <div className="px-6 mb-6">
          <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary-container/40 animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                Cluster: {activeNodesCount} Active Nodes
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-bold bg-surface-container-lowest px-2 py-0.5 rounded-full shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              99.98%
            </span>
          </div>
        </div>

        {/* Navigation Category Label */}
        <div className="px-4 mb-2">
          <span className="px-3 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">
            System Navigation
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center px-4 py-2.5 rounded-full transition-all font-label-lg text-label-lg text-left ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-[0_8px_20px_-4px_rgba(10,65,116,0.3)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="px-6 flex flex-col gap-3">
        <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Throughput Rate
            </span>
            <span className="font-title-md text-title-md text-primary font-bold tracking-tight">
              {throughputRate}
            </span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[22px]">
            speed
          </span>
        </div>
        <div className="pt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
          <span>PLEXO Engine v3.4.1</span>
          <span className="flex items-center gap-1 font-semibold text-secondary">
            L4/L7 Ready
          </span>
        </div>
      </div>
    </aside>
  );
};
