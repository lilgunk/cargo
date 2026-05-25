import { useState } from 'react';
import {
  LayoutDashboard,
  Truck,
  Package,
  Layers,
  BarChart2,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Vehicles', icon: Truck },
  { id: 'cargo', label: 'Cargo', icon: Package },
  { id: 'plan', label: 'Loading Plan', icon: Layers },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
] as const;

type NavId = (typeof NAV_ITEMS)[number]['id'];

export function Sidebar() {
  const [activeId, setActiveId] = useState<NavId>('plan');

  return (
    <aside className="w-52 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 gap-3 border-b border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Truck size={15} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100 leading-tight">CargoPlanner</div>
          <div className="text-xs text-slate-500 leading-tight">Load optimizer</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveId(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeId === id
                ? 'bg-blue-500/15 text-blue-400 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom: Settings + user */}
      <div className="px-2 py-3 border-t border-slate-800 space-y-0.5 flex-shrink-0">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          <Settings size={16} className="flex-shrink-0" />
          <span className="truncate">Settings</span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-blue-400 font-medium">M</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-300 truncate">Maksymilian</div>
            <div className="text-xs text-slate-600 truncate">maks@example.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
