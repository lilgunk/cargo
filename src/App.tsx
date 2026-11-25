import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { useCargoStore } from './hooks/useCargoStore';
import { NavSidebar } from './components/NavSidebar/NavSidebar';
import { Header } from './components/Header/Header';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { ContainerView } from './components/ContainerView/ContainerView';
import { RightPanel } from './components/RightPanel/RightPanel';
import { DashboardHome, ProjectsView } from './components/Dashboard/Dashboard';
import type { ProjectsState } from './components/Dashboard/Dashboard';
import { SettingsView } from './components/SettingsView/SettingsView';
import { buildProject, download, parseProject, planToCsv, projectService, slugify } from './services/projectService';
import type { ProjectSummary, SavedProject } from './services/projectService';
import type { VehicleId } from './types';

function CargoApp() {
  const store = useCargoStore();
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState('home');
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState<string>(() => crypto.randomUUID());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [projects, setProjects] = useState<ProjectsState>({ list: [], loaded: false, failed: false });
  const [reload, setReload] = useState(0);
  const refreshProjects = () => setReload(n => n + 1);

  const { loadProject } = store;
  function openProject(p: SavedProject, saved: boolean) {
    loadProject(p);
    setProjectName(p.name);
    setProjectId(saved ? p.id : crypto.randomUUID()); // an imported file becomes a new project
    setLastSaved(saved ? new Date(p.savedAt) : null);
    setSaveState('idle');
  }

  // The user's projects; the newest one is opened once, on start.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    let active = true;
    projectService.list()
      .then(list => { if (active) setProjects({ list, loaded: true, failed: false }); })
      .catch(() => { if (active) setProjects(p => ({ ...p, loaded: true, failed: true })); });
    return () => { active = false; };
  }, [reload]);
  useEffect(() => {
    if (restored || !projects.loaded) return;
    let active = true;
    const newest = projects.list[0];
    if (newest) {
      projectService.get(newest.id)
        .then(p => { if (active && p) openProject(p, true); })
        .catch(() => { /* offline: start with an empty project */ })
        .finally(() => { if (active) setRestored(true); });
    } else {
      queueMicrotask(() => { if (active) setRestored(true); });
    }
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, after the first list
  }, [projects.loaded]);

  async function handleOpen(id: string) {
    if (id === projectId) { setActiveTab('optimization'); return; }
    try {
      const p = await projectService.get(id);
      if (!p) return;
      openProject(p, true);
      setActiveTab('optimization');
    } catch {
      setProjects(s => ({ ...s, failed: true }));
    }
  }

  async function handleDelete(p: ProjectSummary) {
    if (!confirm(t.projects_confirm_delete.replace('{name}', p.name))) return;
    try {
      await projectService.remove(p.id);
      if (p.id === projectId) setLastSaved(null); // the open project is now unsaved
      refreshProjects();
    } catch {
      setProjects(s => ({ ...s, failed: true }));
    }
  }

  function handleImport(text: string): boolean {
    try {
      openProject(parseProject(text), false);
      setActiveTab('optimization');
      return true;
    } catch {
      return false;
    }
  }

  function handleNewProject(name: string, vehicleId: VehicleId) {
    store.clearAll(vehicleId);
    setProjectName(name);
    setProjectId(crypto.randomUUID());
    setLastSaved(null);
    setActiveTab('optimization');
  }

  const name = projectName || t.modal_title;

  async function handleSave() {
    const now = new Date();
    setSaveState('saving');
    try {
      await projectService.save(buildProject(projectId, name, store.vehicle, store.cargoItems, store.plan, now));
      setLastSaved(now);
      setSaveState('idle');
      refreshProjects();
    } catch {
      setSaveState('error');
    }
  }

  function handleExportJson() {
    const project = buildProject(projectId, name, store.vehicle, store.cargoItems, store.plan);
    download(`${slugify(name)}.nastyk.json`, JSON.stringify(project, null, 2), 'application/json');
  }

  function handleExportCsv() {
    if (store.plan) download(`${slugify(name)}-plan.csv`, planToCsv(store.plan), 'text/csv;charset=utf-8');
  }

  return (
    <div className="h-screen flex bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <NavSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div key={activeTab} className="flex-1 flex flex-col overflow-hidden min-w-0 animate-fade-in">
          {activeTab === 'settings' ? (
            <SettingsView />
          ) : activeTab === 'projects' ? (
            <ProjectsView projects={projects} currentId={projectId} onOpen={handleOpen} onDelete={handleDelete} onImport={handleImport} />
          ) : activeTab === 'optimization' ? (
            <>
              <Header projectName={name} lastSaved={lastSaved} saveState={saveState} canExportPlan={!!store.plan}
                onSave={handleSave} onExportJson={handleExportJson} onExportCsv={handleExportCsv} />
              <div className="flex-1 flex overflow-hidden min-w-0">
                <LeftPanel store={store} />
                <ContainerView store={store} />
                <RightPanel store={store} projectName={name} />
              </div>
            </>
          ) : (
            <DashboardHome store={store} projects={projects} currentId={projectId} onNewProject={handleNewProject}
              onOpen={handleOpen} onShowAll={() => setActiveTab('projects')} onImport={handleImport} />
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
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading, passwordRecovery } = useAuth();
  if (loading) return <Spinner />;
  // Opened a password-reset link: the only thing to do is to set a new password.
  if (passwordRecovery) return <ResetPasswordPage />;

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/app" element={<ProtectedRoute><CargoApp /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to={user ? '/app' : '/login'} replace />} />
    </Routes>
  );
}
