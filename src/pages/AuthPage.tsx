import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFailure, useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import type { Lang } from '../i18n/translations';
import { Eye, EyeOff, Mail, Lock, User, Truck, MailCheck } from 'lucide-react';

type Mode = 'login' | 'register' | 'forgot';
type Notice = { kind: 'confirm' | 'reset'; email: string } | null;

const LANG_FLAGS: Record<Lang, string> = { ru: '🇷🇺', pl: '🇵🇱', en: '🇬🇧' };
const LANGS: Lang[] = ['pl', 'ru', 'en'];

export default function AuthPage() {
  const { login, register, resendConfirmation, requestPasswordReset, linkError } = useAuth();
  const { t, lang, setLang } = useSettings();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(() => (linkError ? t.auth_link_invalid : ''));
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m); setError(''); setUnconfirmed(false); setNotice(null); setResent(false);
    setPassword('');
  };

  const errorText = (err: unknown) => {
    if (err instanceof AuthFailure) return t[`auth_err_${err.code}`];
    return t.auth_err_unknown;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setUnconfirmed(false); setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/app');
      } else if (mode === 'register') {
        if (password.length < 8) { setError(t.auth_err_weak_password); return; }
        const mustConfirm = await register(name, email, password);
        if (mustConfirm) setNotice({ kind: 'confirm', email });
        else navigate('/app');
      } else {
        await requestPasswordReset(email);
        setNotice({ kind: 'reset', email });
      }
    } catch (err: unknown) {
      setError(errorText(err));
      if (err instanceof AuthFailure && err.code === 'email_not_confirmed') setUnconfirmed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await resendConfirmation(notice?.email ?? email);
      setResent(true);
    } catch (err: unknown) {
      setError(errorText(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left — form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 max-w-lg relative">
        {/* Lang switcher */}
        <div className="absolute top-6 right-8 flex gap-1.5">
          {LANGS.map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                lang === l
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {LANG_FLAGS[l]} {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Truck size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-base leading-tight">LoadOpti</div>
            <div className="text-[10px] text-gray-400 leading-tight">Cargo Planner</div>
          </div>
        </div>

        {notice ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6" role="status">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
              <MailCheck size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {notice.kind === 'confirm' ? t.auth_check_email_title : t.auth_reset_sent_title}
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              {notice.kind === 'confirm' ? t.auth_check_email_text : t.auth_reset_sent_text}
            </p>
            <p className="text-sm font-semibold text-gray-900 mb-5 break-all">{notice.email}</p>
            {notice.kind === 'confirm' && (
              <button type="button" onClick={handleResend} disabled={resent}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400">
                {resent ? t.auth_resent : t.auth_resend}
              </button>
            )}
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            <div className="mt-6 pt-4 border-t border-blue-100">
              <button type="button" onClick={() => switchMode('login')} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                ← {t.auth_back_to_login}
              </button>
            </div>
          </div>
        ) : (
        <>
        {mode === 'login' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.auth_welcome}</h1>
            <p className="text-gray-500 text-sm mb-8">{t.auth_welcome_sub}</p>
          </>
        ) : mode === 'register' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.auth_register_title}</h1>
            <p className="text-gray-500 text-sm mb-8">{t.auth_register_sub}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.auth_forgot_title}</h1>
            <p className="text-gray-500 text-sm mb-8">{t.auth_forgot_sub}</p>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth_name}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder={t.auth_name_placeholder} required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth_email}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com" required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors" />
            </div>
          </div>

          {mode !== 'forgot' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth_password}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={mode === 'register' ? 8 : undefined}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === 'register' && <p className="text-xs text-gray-400 mt-1.5">{t.auth_password_hint}</p>}
          </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <button type="button" onClick={() => switchMode('forgot')} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                {t.auth_forgot}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm" role="alert">
              {error}
              {unconfirmed && (
                <button type="button" onClick={async () => { await handleResend(); setNotice({ kind: 'confirm', email }); }}
                  className="block mt-1.5 text-blue-600 hover:text-blue-700 font-medium">
                  {t.auth_resend}
                </button>
              )}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-1">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : mode === 'login' ? t.auth_login_btn : mode === 'register' ? t.auth_register_btn : t.auth_send_reset
            }
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          {mode === 'login' ? t.auth_no_account : t.auth_have_account}{' '}
          <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            {mode === 'login' ? t.auth_go_register : t.auth_go_login}
          </button>
        </p>
        </>
        )}
      </div>

      {/* Right — illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center px-12">
          <div className="w-72 h-48 mx-auto mb-8 flex items-center justify-center">
            <svg viewBox="0 0 400 260" className="w-full h-full drop-shadow-lg">
              <rect x="20" y="80" width="280" height="140" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
              <rect x="20" y="80" width="280" height="140" rx="8" fill="url(#truckGrad)"/>
              <rect x="300" y="110" width="80" height="110" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
              <rect x="305" y="115" width="40" height="35" rx="4" fill="#bfdbfe"/>
              <circle cx="90" cy="225" r="22" fill="#374151" stroke="#1f2937" strokeWidth="3"/>
              <circle cx="90" cy="225" r="10" fill="#9ca3af"/>
              <circle cx="260" cy="225" r="22" fill="#374151" stroke="#1f2937" strokeWidth="3"/>
              <circle cx="260" cy="225" r="10" fill="#9ca3af"/>
              <circle cx="340" cy="225" r="22" fill="#374151" stroke="#1f2937" strokeWidth="3"/>
              <circle cx="340" cy="225" r="10" fill="#9ca3af"/>
              <rect x="40" y="130" width="60" height="50" rx="3" fill="#818cf8" opacity="0.9"/>
              <rect x="110" y="140" width="50" height="40" rx="3" fill="#34d399" opacity="0.9"/>
              <rect x="170" y="125" width="70" height="55" rx="3" fill="#fbbf24" opacity="0.9"/>
              <rect x="40" y="100" width="45" height="35" rx="3" fill="#818cf8" opacity="0.7"/>
              <line x1="20" y1="70" x2="300" y2="70" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,3"/>
              <text x="160" y="62" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">4325 mm</text>
              <line x1="310" y1="80" x2="310" y2="220" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,3"/>
              <text x="330" y="155" fill="#64748b" fontSize="11" fontFamily="monospace" transform="rotate(90,330,155)">1940 mm</text>
              <defs>
                <linearGradient id="truckGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f8fafc"/>
                  <stop offset="100%" stopColor="#f1f5f9"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t.auth_hero_title}</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">{t.auth_hero_sub}</p>
        </div>
      </div>
    </div>
  );
}
