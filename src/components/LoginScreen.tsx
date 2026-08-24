import React, { useState } from 'react';
import { LogIn, Moon, Sun, KeyRound, Phone } from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  users,
  isDarkMode,
  setIsDarkMode
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(identifier.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        // Fallback search in local users array if offline/api fallback
        const cleanIdent = identifier.trim().toLowerCase();
        const found = users.find(u => 
          u.phone.replace(/[\s\-\+]/g, '').includes(cleanIdent.replace(/[\s\-\+]/g, '')) ||
          u.email.toLowerCase() === cleanIdent ||
          u.name.toLowerCase().includes(cleanIdent)
        );

        if (found) {
          onLoginSuccess(found);
        } else {
          setError(res.error || 'بيانات الدخول غير مسجلة في النظام. تأكد من إدخال رقم الجوال أو البريد الصحيح');
        }
      }
    } catch {
      // Local fallback
      const cleanIdent = identifier.trim().toLowerCase();
      const found = users.find(u => 
        u.phone.replace(/[\s\-\+]/g, '').includes(cleanIdent.replace(/[\s\-\+]/g, '')) ||
        u.email.toLowerCase() === cleanIdent
      );
      if (found) {
        onLoginSuccess(found);
      } else {
        setError('تعذر تسجيل الدخول، يرجى التأكد من صحة رقم الهاتف أو البريد الإلكتروني المسجل.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors font-sans select-none">
      {/* Top right theme toggle */}
      <div className="fixed top-4 left-4 z-20">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          title="تبديل المظهر"
          aria-label="تبديل المظهر"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md my-auto">
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Header Brand */}
          <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800/80 bg-linear-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl font-black mx-auto mb-3 shadow-lg shadow-emerald-600/20">
              📖
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              منصة إتقان
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              المنظومة الذكية لإدارة وتوثيق حلقات القرآن الكريم
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <span className="shrink-0 text-base">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رقم الهاتف أو البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="مثال: 0551122334 أو teacher@katatibi.com"
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  dir="auto"
                  autoFocus
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                سجل الدخول بالرقم المعتمد لك لدى إدارة المركز
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  كلمة المرور
                </label>
                <span className="text-[10px] text-slate-400 font-medium">(اختياري)</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <KeyRound className="w-4 h-4" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>جاري التحقق والدخول...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          نظام متصل بقاعدة بيانات سحابية PostgreSQL • يضمن خصوصية وصلاحيات كل حساب
        </p>
      </div>
    </div>
  );
};
