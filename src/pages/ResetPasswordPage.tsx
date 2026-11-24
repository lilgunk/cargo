import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { AuthFailure, useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

/** Opened from the password-reset e-mail: Supabase has already signed the user in from the link. */
export default function ResetPasswordPage() {
  const { user, passwordRecovery, updatePassword } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const canReset = passwordRecovery || !!user;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError(t.auth_err_weak_password); return; }
    setError(''); setSaving(true);
    try {
      await updatePassword(password);
      navigate('/app', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof AuthFailure ? t[`auth_err_${err.code}`] : t.auth_err_unknown);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
          <KeyRound size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{t.auth_new_password_title}</h1>

        {!canReset ? (
          <>
            <p className="text-sm text-gray-600 mt-2 mb-6">{t.auth_reset_invalid}</p>
            <button onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
              {t.auth_back_to_login}
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 mb-5">{t.auth_new_password_sub}</p>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={8} autoComplete="new-password" autoFocus
                aria-label={t.auth_new_password_title}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400">{t.auth_password_hint}</p>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm" role="alert">{error}</div>}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {saving ? '…' : t.auth_new_password_btn}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
