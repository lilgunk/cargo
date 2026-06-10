import { useNavigate } from 'react-router-dom';
import { FolderOpen, Truck, Package, Cpu, BarChart2, Settings, LogOut, Crown, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

interface Props {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function NavSidebar({ activeTab, onTabChange }: Props) {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const NAV = [
    { id: 'home',         label: t.nav_home,         icon: Home },
    { id: 'projects',     label: t.nav_projects,     icon: FolderOpen },
    { id: 'transport',    label: t.nav_transport,     icon: Truck },
    { id: 'cargo',        label: t.nav_cargo,         icon: Package },
    { id: 'optimization', label: t.nav_optimization,  icon: Cpu },
    { id: 'results',      label: t.nav_results,       icon: BarChart2 },
  ];

  return (
    <aside className="w-44 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div onClick={() => onTabChange('home')} className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-800 flex-shrink-0 cursor-pointer hover:bg-slate-800/50 transition-colors">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-100 leading-tight">LoadOpti</div>
          <div className="text-[10px] text-slate-500 leading-tight">Cargo Planner</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeTab === id
                ? 'bg-blue-600/15 text-blue-400 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}>
            <Icon size={16} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 border-t border-slate-800 pt-3 space-y-0.5 flex-shrink-0">
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-amber-500 hover:bg-amber-500/10 transition-colors">
            <Crown size={16} className="flex-shrink-0" />
            <span className="truncate">{t.nav_admin}</span>
          </button>
        )}
        <button onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            activeTab === 'settings'
              ? 'bg-blue-600/15 text-blue-400 font-medium'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}>
          <Settings size={16} className="flex-shrink-0" />
          <span className="truncate">{t.nav_settings}</span>
        </button>
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut size={16} className="flex-shrink-0" />
          <span className="truncate">{t.nav_logout}</span>
        </button>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-indigo-300 font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-300 truncate font-medium">{user?.name ?? '—'}</div>
            <div className="text-[10px] text-slate-600 truncate">{user?.email ?? ''}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
