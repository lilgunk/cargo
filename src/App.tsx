import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import type { Theme } from './contexts/SettingsContext';
import type { Lang } from './i18n/translations';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import { useCargoStore } from './hooks/useCargoStore';
import type { CargoStore } from './hooks/useCargoStore';
import { NavSidebar } from './components/NavSidebar/NavSidebar';
import { Header } from './components/Header/Header';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { ContainerView } from './components/ContainerView/ContainerView';
import { RightPanel } from './components/RightPanel/RightPanel';
import {
  FolderOpen, Truck, Package, TrendingUp, Plus, ChevronRight, Bell, X, Check,
  Sun, Moon, Globe,
} from 'lucide-react';
import { VEHICLES } from './data/mockData';
import type { VehicleId } from './types';

function NewProjectModal({ onConfirm, onClose }: {
  onConfirm: (name: string, vehicleId: VehicleId) => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const [name, setName] = useState('');
  const [vehicleId, setVehicleId] = useState<VehicleId>('large');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[520px] mx-4 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">{t.modal_title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.modal_name}</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder={t.modal_placeholder}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.modal_vehicle}</label>
            <div className="space-y-2">
              {VEHICLES.map(v => (
                <button key={v.id} onClick={() => setVehicleId(v.id as VehicleId)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left ${
                    vehicleId === v.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}>
                  <div className="w-16 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {v.images?.side
                      ? <img src={v.images.side} alt="" className="w-full h-full object-contain" />
                      : <Truck size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.name}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                      {v.length / 1000}×{v.width / 1000}×{v.height / 1000} {t.modal_m} · {t.modal_up_to} {v.maxWeight} {t.modal_kg}
                    </div>
                  </div>
                  {vehicleId === v.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            {t.modal_cancel}
          </button>
          <button onClick={() => onConfirm(name.trim() || t.modal_title, vehicleId)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
            {t.modal_create}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  const { lang, setLang, theme, setTheme, t } = useSettings();

  const LANGS: { id: Lang; label: string; native: string; flag: string }[] = [
    { id: 'ru', label: 'Русский', native: 'Русский', flag: '🇷🇺' },
    { id: 'pl', label: 'Polski',  native: 'Polski',  flag: '🇵🇱' },
    { id: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  ];

  const THEMES: { id: Theme; icon: typeof Sun; label: string; desc: string; preview: string }[] = [
    { id: 'light', icon: Sun,  label: t.settings_light, desc: t.settings_light_desc,
      preview: 'bg-white border-gray-200' },
    { id: 'dark',  icon: Moon, label: t.settings_dark,  desc: t.settings_dark_desc,
      preview: 'bg-slate-800 border-slate-600' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-8 flex-shrink-0">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">{t.settings_title}</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">{t.settings_saved}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 max-w-2xl">
        {/* Language */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t.settings_lang}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LANGS.map(l => (
              <button key={l.id} onClick={() => setLang(l.id)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                  lang === l.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                <span className="text-3xl">{l.flag}</span>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${lang === l.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {l.native}
                  </div>
                </div>
                {lang === l.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sun size={16} className="text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t.settings_theme}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map(th => {
              const Icon = th.icon;
              return (
                <button key={th.id} onClick={() => setTheme(th.id)}
                  className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all text-left ${
                    theme === th.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                  }`}>
                  {/* Mini preview */}
                  <div className={`w-full h-16 rounded-xl border ${th.preview} overflow-hidden flex`}>
                    <div className={`w-8 h-full ${th.id === 'dark' ? 'bg-slate-950' : 'bg-slate-800'}`} />
                    <div className="flex-1 p-2 flex flex-col gap-1.5">
                      <div className={`h-2 w-16 rounded ${th.id === 'dark' ? 'bg-slate-600' : 'bg-gray-200'}`} />
                      <div className={`h-2 w-10 rounded ${th.id === 'dark' ? 'bg-slate-700' : 'bg-gray-100'}`} />
                      <div className={`h-5 w-full rounded-lg mt-auto ${th.id === 'dark' ? 'bg-blue-600/40' : 'bg-blue-100'}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-semibold ${theme === th.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        <Icon size={14} className="inline mr-1.5 mb-0.5" />{th.label}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{th.desc}</div>
                    </div>
                    {theme === th.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

const DASH_PROJECTS = [
  { id: 1, name: 'Доставка мебели', vehicle: 'Mercedes Sprinter L3H2', date: '29.05.2024', progress: 87, img: '/vehicles/sprinter-l3h2-side.png' },
  { id: 2, name: 'Строительные материалы', vehicle: 'MAN TGE', date: '24.05.2024', progress: 63, img: null },
  { id: 3, name: 'Бытовая техника', vehicle: 'Iveco Daily', date: '22.05.2024', progress: 100, img: null },
];

function DashboardHome({ onNewProject, store }: {
  onNewProject: (name: string, vehicleId: VehicleId) => void;
  store: CargoStore;
}) {
  const { t } = useSettings();
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setLoaded(true), 600); return () => clearTimeout(timer); }, []);
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {showModal && (
        <NewProjectModal
          onConfirm={(name, vid) => { setShowModal(false); onNewProject(name, vid); }}
          onClose={() => setShowModal(false)}
        />
      )}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-8 flex-shrink-0">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">{t.dash_title}</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">{t.dash_subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={15} />
            {t.dash_new_project}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-4 gap-5 mb-8">
          {!loaded ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
                  <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-slate-700" />
                </div>
                <div className="h-8 w-12 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-2.5 w-16 bg-gray-100 dark:bg-slate-700 rounded" />
              </div>
            ))
          ) : (
            [
              { label: t.dash_stat_projects, value: '1',                              sub: t.dash_stat_active,              icon: FolderOpen, color: 'blue' },
              { label: t.dash_stat_transport, value: String(store.vehicleId ? 1 : 0), sub: store.vehicle.name,              icon: Truck,       color: 'indigo' },
              { label: t.dash_stat_cargo,    value: String(store.totalItems),         sub: `${store.cargoItems.length} ${t.dash_stat_cargo.toLowerCase()}`, icon: Package, color: 'violet' },
              { label: t.dash_stat_fill,     value: `${store.occupancy}%`,            sub: `${store.usedVolume.toFixed(2)} м³`, icon: TrendingUp, color: 'emerald' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' : color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20' : color === 'violet' ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
                  }`}>
                    <Icon size={18} className={color === 'blue' ? 'text-blue-500' : color === 'indigo' ? 'text-indigo-500' : color === 'violet' ? 'text-violet-500' : 'text-emerald-500'} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-0.5">{value}</div>
                <div className="text-xs text-gray-400 dark:text-slate-500">{sub}</div>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t.dash_recent}</h2>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                {t.dash_all} <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-700">
              {DASH_PROJECTS.map(p => (
                <div key={p.id} onClick={() => setShowModal(true)}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <div className="w-12 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.img ? <img src={p.img} alt="" className="w-full h-full object-cover" /> : <Truck size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{p.vehicle} · {p.date}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-24">
                      <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400 w-8 text-right">{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-50 dark:border-slate-700">
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                <Plus size={14} /> {t.dash_new_project}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t.dash_quick}</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t.dash_quick_sub}</p>
            </div>
            <div className="p-6 space-y-4">
              <div onClick={() => setShowModal(true)}
                className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Package size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t.dash_drag}</p>
                <p className="text-xs text-blue-600 font-medium mt-1">{t.dash_or_file}</p>
              </div>
              <button onClick={() => setShowModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                {t.dash_create_opt}
              </button>
            </div>
            <div className="mx-6 mb-6 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-slate-400">{t.dash_3d}</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded font-medium">{t.dash_soon}</span>
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
  );
}

function CargoApp() {
  const store = useCargoStore();
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState('home');
  const [projectName, setProjectName] = useState('');

  function handleNewProject(name: string, vehicleId: VehicleId) {
    store.clearAll(vehicleId);
    setProjectName(name);
    setActiveTab('optimization');
  }

  return (
    <div className="h-screen flex bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <NavSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div key={activeTab} className="flex-1 flex flex-col overflow-hidden min-w-0 animate-fade-in">
          {activeTab === 'home' ? (
            <DashboardHome onNewProject={handleNewProject} store={store} />
          ) : activeTab === 'settings' ? (
            <SettingsView />
          ) : activeTab === 'optimization' ? (
            <>
              <Header projectName={projectName || t.modal_title} />
              <div className="flex-1 flex overflow-hidden min-w-0">
                <LeftPanel store={store} />
                <ContainerView store={store} />
                <RightPanel store={store} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">
              {t.nav_results} — раздел в разработке
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/app" element={<ProtectedRoute><CargoApp /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to={user ? '/app' : '/login'} replace />} />
    </Routes>
  );
}
