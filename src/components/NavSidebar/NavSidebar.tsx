import { useState } from 'react';
import {
  FolderOpen,
  Truck,
  Package,
  Cpu,
  BarChart2,
  Settings,
} from 'lucide-react';

const NAV = [
  { id: 'projects', label: 'Проекты', icon: FolderOpen },
  { id: 'transport', label: 'Транспорт', icon: Truck },
  { id: 'cargo', label: 'Грузы', icon: Package },
  { id: 'optimization', label: 'Оптимизация', icon: Cpu },
  { id: 'results', label: 'Результаты', icon: BarChart2 },
] as const;

type NavId = (typeof NAV)[number]['id'];

export function NavSidebar() {
  const [active, setActive] = useState<NavId>('projects');

  return (
    <aside className="w-44 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-100 leading-tight">LoadOpti</div>
          <div className="text-[10px] text-slate-500 leading-tight">Оптимизация загрузки</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active === id
                ? 'bg-blue-600/15 text-blue-400 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 border-t border-slate-800 pt-3 space-y-0.5 flex-shrink-0">
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          <Settings size={16} className="flex-shrink-0" />
          <span className="truncate">Настройки</span>
        </button>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-slate-300 font-semibold">M</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-300 truncate font-medium">Maksymilian</div>
            <div className="text-[10px] text-slate-600 truncate">maks@example.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
