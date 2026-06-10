import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FolderOpen, Truck, Package, Cpu, BarChart2, Settings,
  Bell, Plus, Crown, LogOut, TrendingUp, ChevronRight,
} from 'lucide-react';

const MOCK_PROJECTS = [
  { id: 1, name: 'Доставка мебели', vehicle: 'Mercedes Sprinter L3H2', date: '29.05.2024', progress: 87, img: '/vehicles/sprinter-l3h2-side.png' },
  { id: 2, name: 'Строительные материалы', vehicle: 'MAN TGE', date: '24.05.2024', progress: 63, img: null },
  { id: 3, name: 'Бытовая техника', vehicle: 'Iveco Daily', date: '22.05.2024', progress: 100, img: null },
];

const NAV = [
  { id: 'home', label: 'Главная', icon: BarChart2, active: true },
  { id: 'projects', label: 'Проекты', icon: FolderOpen },
  { id: 'transport', label: 'Транспорт', icon: Truck },
  { id: 'cargo', label: 'Грузы', icon: Package },
  { id: 'optimization', label: 'Оптимизация', icon: Cpu },
  { id: 'results', label: 'Результаты', icon: BarChart2 },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="h-screen flex bg-gray-50 text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">LoadOpti</div>
            <div className="text-[10px] text-gray-400 leading-tight">Оптимизация загрузки</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon, active }) => (
            <button key={id}
              onClick={() => id === 'optimization' && navigate('/app')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
              <Icon size={16} className="flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-0.5">
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-amber-500 hover:bg-amber-50 transition-colors">
              <Crown size={16} className="flex-shrink-0" />
              <span>Админ</span>
            </button>
          )}
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut size={16} className="flex-shrink-0" />
            <span>Выйти</span>
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-blue-600 font-semibold">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 shadow-sm">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Главная</h1>
            <p className="text-xs text-gray-400">Обзор ваших проектов и последних действий</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
            <button onClick={() => navigate('/app')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Plus size={15} />
              Новый проект
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Проекты', value: '12', sub: 'активных', icon: FolderOpen, color: 'blue' },
              { label: 'Транспорт', value: '8', sub: 'единиц', icon: Truck, color: 'indigo' },
              { label: 'Грузы', value: '48', sub: 'наименований', icon: Package, color: 'violet' },
              { label: 'Оптимизация', value: '23', sub: 'выполнено', icon: TrendingUp, color: 'emerald' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">{label}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    color === 'blue' ? 'bg-blue-50' : color === 'indigo' ? 'bg-indigo-50' : color === 'violet' ? 'bg-violet-50' : 'bg-emerald-50'
                  }`}>
                    <Icon size={18} className={
                      color === 'blue' ? 'text-blue-500' : color === 'indigo' ? 'text-indigo-500' : color === 'violet' ? 'text-violet-500' : 'text-emerald-500'
                    } />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-0.5">{value}</div>
                <div className="text-xs text-gray-400">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Recent projects */}
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 text-sm">Последние проекты</h2>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  Все проекты <ChevronRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {MOCK_PROJECTS.map(p => (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <div className="w-12 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.img
                        ? <img src={p.img} alt="" className="w-full h-full object-cover" />
                        : <Truck size={18} className="text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.vehicle} · {p.date}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500 w-8 text-right">{p.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-50">
                <button onClick={() => navigate('/app')}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  <Plus size={14} />
                  Новый проект
                </button>
              </div>
            </div>

            {/* Quick optimization */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-800 text-sm">Быстрая оптимизация</h2>
                <p className="text-xs text-gray-400 mt-0.5">Создайте новую оптимизацию загрузки за несколько шагов</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/app')}>
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Package size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Перетащите грузы сюда</p>
                  <p className="text-xs text-blue-600 font-medium mt-1 hover:text-blue-700">или выберите файл</p>
                </div>
                <button onClick={() => navigate('/app')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                  Создать оптимизацию
                </button>
              </div>

              {/* 3D preview hint */}
              <div className="mx-6 mb-6 rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">3D превью</span>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">скоро</span>
                </div>
                <div className="h-20 flex items-center justify-center">
                  <svg viewBox="0 0 120 80" className="w-full h-full opacity-40">
                    <rect x="10" y="20" width="40" height="30" rx="2" fill="#818cf8"/>
                    <rect x="55" y="25" width="30" height="25" rx="2" fill="#34d399"/>
                    <rect x="90" y="15" width="25" height="35" rx="2" fill="#fbbf24"/>
                    <rect x="10" y="5" width="30" height="18" rx="2" fill="#818cf8" opacity="0.6"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
