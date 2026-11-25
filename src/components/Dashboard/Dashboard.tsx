// Home page and the project list — the data (saved projects) comes from CargoApp.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronRight, FolderOpen, Package, Plus, TrendingUp, Truck } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { CargoStore } from '../../hooks/useCargoStore';
import type { ProjectSummary } from '../../services/projectService';
import type { VehicleId } from '../../types';
import { ImportDrop } from '../ImportDrop/ImportDrop';
import { NewProjectModal } from '../NewProjectModal/NewProjectModal';
import { ProjectList } from '../ProjectList/ProjectList';

export interface ProjectsState {
  list: ProjectSummary[];
  loaded: boolean;
  failed: boolean;
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: typeof FolderOpen; color: 'blue' | 'indigo' | 'violet' | 'emerald';
}) {
  const bg = { blue: 'bg-blue-50 dark:bg-blue-900/20', indigo: 'bg-indigo-50 dark:bg-indigo-900/20', violet: 'bg-violet-50 dark:bg-violet-900/20', emerald: 'bg-emerald-50 dark:bg-emerald-900/20' }[color];
  const fg = { blue: 'text-blue-500', indigo: 'text-indigo-500', violet: 'text-violet-500', emerald: 'text-emerald-500' }[color];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}><Icon size={18} className={fg} /></div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-0.5 truncate">{value}</div>
      <div className="text-xs text-gray-400 dark:text-slate-500 truncate">{sub}</div>
    </div>
  );
}

function ProjectsBox({ projects, currentId, onOpen, onDelete, limit, action }: {
  projects: ProjectsState; currentId: string; onOpen: (id: string) => void;
  onDelete?: (p: ProjectSummary) => void; limit?: number; action?: ReactNode;
}) {
  const { t } = useSettings();
  return (
    <>
      {!projects.loaded ? (
        <div className="flex justify-center py-10">
          <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : projects.failed ? (
        <p className="px-6 py-8 text-sm text-center text-red-500" role="alert">{t.projects_load_error}</p>
      ) : (
        <ProjectList projects={limit ? projects.list.slice(0, limit) : projects.list} currentId={currentId} onOpen={onOpen} onDelete={onDelete} />
      )}
      {action && <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700">{action}</div>}
    </>
  );
}

export function DashboardHome({ store, projects, currentId, onNewProject, onOpen, onShowAll, onImport }: {
  store: CargoStore;
  projects: ProjectsState;
  currentId: string;
  onNewProject: (name: string, vehicleId: VehicleId) => void;
  onOpen: (id: string) => void;
  onShowAll: () => void;
  onImport: (text: string) => boolean;
}) {
  const { t } = useSettings();
  const [showModal, setShowModal] = useState(false);
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
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={15} />
          {t.dash_new_project}
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-4 gap-5 mb-8">
          <StatCard label={t.dash_stat_projects} value={projects.loaded ? String(projects.list.length) : '…'} sub={t.nav_projects} icon={FolderOpen} color="blue" />
          <StatCard label={t.dash_stat_transport} value={`${(store.maxVolume).toFixed(1)} ${t.unit_m3}`} sub={store.vehicle.name} icon={Truck} color="indigo" />
          <StatCard label={t.dash_stat_cargo} value={String(store.totalItems)} sub={`${store.totalWeight} ${t.unit_kg}`} icon={Package} color="violet" />
          <StatCard label={t.dash_stat_fill} value={store.plan ? `${store.occupancy}%` : '—'} sub={`${store.usedVolume.toFixed(2)} ${t.unit_m3}`} icon={TrendingUp} color="emerald" />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t.dash_recent}</h2>
              <button onClick={onShowAll} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                {t.dash_all} <ChevronRight size={12} />
              </button>
            </div>
            <ProjectsBox projects={projects} currentId={currentId} onOpen={onOpen} limit={5}
              action={(
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  <Plus size={14} /> {t.dash_new_project}
                </button>
              )} />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t.dash_quick}</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t.dash_quick_sub}</p>
            </div>
            <div className="p-6 space-y-4">
              <ImportDrop onImport={onImport} />
              <button onClick={() => setShowModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                {t.dash_create_opt}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ProjectsView({ projects, currentId, onOpen, onDelete, onImport }: {
  projects: ProjectsState; currentId: string;
  onOpen: (id: string) => void; onDelete: (p: ProjectSummary) => void; onImport: (text: string) => boolean;
}) {
  const { t } = useSettings();
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-8 flex-shrink-0">
        <h1 className="font-bold text-gray-900 dark:text-gray-100">{t.nav_projects}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-8 grid grid-cols-3 gap-5 items-start">
        <div className="col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <ProjectsBox projects={projects} currentId={currentId} onOpen={onOpen} onDelete={onDelete} />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-4">{t.projects_import}</h2>
          <ImportDrop onImport={onImport} />
        </div>
      </main>
    </div>
  );
}
