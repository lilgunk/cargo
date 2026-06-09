import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users, Trash2, Shield, ShieldOff, ArrowLeft,
  UserCheck, UserPlus, Calendar, Crown,
} from 'lucide-react';

const ADMIN_EMAIL = 'admin@loadopti.com';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });
    if (error) { setError('Ошибка загрузки'); }
    else setUsers((data ?? []).map(d => ({ id: d.id, name: d.name, email: d.email, role: d.role, createdAt: d.created_at })));
    setLoading(false);
  }

  async function deleteUser(id: string) {
    if (!confirm('Удалить пользователя?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  async function toggleRole(u: User) {
    if (u.email === ADMIN_EMAIL) return;
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', u.id);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
  }

  const total = users.length;
  const admins = users.filter(u => u.role === 'admin').length;
  const recent = users.filter(u => Date.now() - new Date(u.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length;

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft size={16} />Назад
            </button>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-amber-400" />
              <span className="font-semibold text-sm">Панель администратора</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">{user?.name}</span>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors text-sm">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users size={20} className="text-indigo-400" />} label="Всего пользователей" value={total} color="indigo" />
          <StatCard icon={<Crown size={20} className="text-amber-400" />} label="Администраторов" value={admins} color="amber" />
          <StatCard icon={<UserPlus size={20} className="text-emerald-400" />} label="За последние 7 дней" value={recent} color="emerald" />
          <StatCard icon={<UserCheck size={20} className="text-sky-400" />} label="Обычных пользователей" value={total - admins} color="sky" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              Пользователи
              <span className="ml-1 bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{users.length}</span>
            </h2>
            <button onClick={fetchUsers} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Обновить</button>
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
                    <th className="text-left px-6 py-3 font-medium"><span className="flex items-center gap-1"><Calendar size={12} />Регистрация</span></th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-indigo-300 font-semibold">{u.name.slice(0, 2).toUpperCase()}</span>
                          </div>
                          <span className="text-slate-200 font-medium">{u.name}</span>
                          {u.id === user?.id && <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">это вы</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">{u.email}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-slate-700/60 text-slate-400 border border-slate-700'}`}>
                          {u.role === 'admin' && <Crown size={10} />}
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-3.5">
                        {u.id !== user?.id && u.email !== ADMIN_EMAIL && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button onClick={() => toggleRole(u)} title={u.role === 'admin' ? 'Снять admin' : 'Сделать admin'}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors">
                              {u.role === 'admin' ? <ShieldOff size={15} /> : <Shield size={15} />}
                            </button>
                            <button onClick={() => deleteUser(u.id)} title="Удалить"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
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

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number;
  color: 'indigo' | 'amber' | 'emerald' | 'sky';
}) {
  const bg = { indigo: 'bg-indigo-500/10 border-indigo-500/20', amber: 'bg-amber-500/10 border-amber-500/20', emerald: 'bg-emerald-500/10 border-emerald-500/20', sky: 'bg-sky-500/10 border-sky-500/20' }[color];
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center mb-3">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </div>
  );
}
