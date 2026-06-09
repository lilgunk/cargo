import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiUrl } from '../contexts/AuthContext';
import {
  Users, Trash2, Shield, ShieldOff, ArrowLeft,
  UserCheck, UserPlus, Calendar, Crown,
} from 'lucide-react';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface Stats {
  total: number;
  admins: number;
  recent: number;
  latest: { name: string; email: string; created_at: string }[];
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(apiUrl('/api/admin/users'), { headers: authHeaders() }),
        fetch(apiUrl('/api/admin/stats'), { headers: authHeaders() }),
      ]);
      if (usersRes.status === 403) { setError('Нет доступа'); setLoading(false); return; }
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      setUsers(usersData.users ?? []);
      setStats(statsData);
    } catch {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: number) {
    if (!confirm('Удалить пользователя?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.filter(u => u.id !== id));
      if (stats) setStats({ ...stats, total: stats.total - 1 });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleRole(u: UserRow) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setTogglingId(u.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${u.id}/role`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setTogglingId(null);
    }
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Назад
            </button>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-amber-400" />
              <span className="font-semibold text-sm">Панель администратора</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">{user?.name}</span>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users size={20} className="text-indigo-400" />}
              label="Всего пользователей"
              value={stats.total}
              color="indigo"
            />
            <StatCard
              icon={<Crown size={20} className="text-amber-400" />}
              label="Администраторов"
              value={stats.admins}
              color="amber"
            />
            <StatCard
              icon={<UserPlus size={20} className="text-emerald-400" />}
              label="За последние 7 дней"
              value={stats.recent}
              color="emerald"
            />
            <StatCard
              icon={<UserCheck size={20} className="text-sky-400" />}
              label="Обычных пользователей"
              value={stats.total - stats.admins}
              color="sky"
            />
          </div>
        )}

        {/* Users table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              Пользователи
              {!loading && (
                <span className="ml-1 bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                  {users.length}
                </span>
              )}
            </h2>
            <button
              onClick={fetchAll}
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
            >
              Обновить
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">Нет пользователей</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-b border-slate-800">
                    <th className="text-left px-6 py-3 font-medium">Имя</th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Роль</th>
                    <th className="text-left px-6 py-3 font-medium">
                      <span className="flex items-center gap-1"><Calendar size={12} />Регистрация</span>
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-indigo-300 font-semibold">
                              {u.name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-slate-200 font-medium">{u.name}</span>
                          {u.id === user?.id && (
                            <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">это вы</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">{u.email}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                          u.role === 'admin'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-700/60 text-slate-400 border border-slate-700'
                        }`}>
                          {u.role === 'admin' ? <Crown size={10} /> : null}
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 text-xs">{formatDate(u.created_at)}</td>
                      <td className="px-6 py-3.5">
                        {u.id !== user?.id && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button
                              onClick={() => toggleRole(u)}
                              disabled={togglingId === u.id}
                              title={u.role === 'admin' ? 'Снять admin' : 'Сделать admin'}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-40"
                            >
                              {u.role === 'admin' ? <ShieldOff size={15} /> : <Shield size={15} />}
                            </button>
                            <button
                              onClick={() => deleteUser(u.id)}
                              disabled={deletingId === u.id}
                              title="Удалить пользователя"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'indigo' | 'amber' | 'emerald' | 'sky';
}) {
  const bg = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    sky: 'bg-sky-500/10 border-sky-500/20',
  }[color];

  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </div>
  );
}
