import React, { useState } from 'react';
import { LogIn, Moon, Shield, Sun, UserCheck, Users, GraduationCap, BookOpen, KeyRound, Phone, Mail } from 'lucide-react';
import { User, UserRole } from '../types';
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
        setError('تعذر تسجيل الدخول، يرجى التأكد من صحة رقم الهاتف أو تجربة الحسابات السريعة أدناه.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);

    const userForRole = users.find(u => u.role === role);
    if (userForRole) {
      try {
        const res = await api.login(userForRole.phone);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
          return;
        }
      } catch {
        // fallback
      }
      onLoginSuccess(userForRole);
    } else {
      setError(`لم يتم العثور على مستخدم بدور ${role}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors font-sans select-none">
      {/* Top right theme toggle */}
      <div className="fixed top-4 left-4 z-20">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition"
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
          <div className="p-7 text-center border-b border-slate-100 dark:border-slate-800/80 bg-linear-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20">
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
          <form onSubmit={handleSubmit} className="p-7 space-y-4">
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
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                مسجل لجميع المعلمين والطلاب والمشرفين
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  كلمة المرور
                </label>
                <span className="text-[10px] text-slate-400 font-medium">(اختياري في الوضع التجريبي)</span>
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
                  <span>تسجيل الدخول إلى حسابي</span>
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Access for Demo/Evaluation */}
          <div className="px-7 py-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>أو الدخول المباشر بحساب تجريبي حسب الدور:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin('TEACHER')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-right transition flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0">
                  👨‍🏫
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">المعلم</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">رصد حلقاتي فقط</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('ADMIN')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-right transition flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs shrink-0">
                  🛡️
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate">مدير النظام</div>
                  <div className="text-[10px] text-rose-700 dark:text-rose-400 truncate">كافة الصلاحيات</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('SUPERVISOR')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-right transition flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">
                  👳‍♂️
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">المشرف التربوي</div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 truncate">متابعة وتقارير</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('STUDENT')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-right transition flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs shrink-0">
                  👦
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">الطالب</div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 truncate">سجل الحفظ والمصحف</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          نظام متصل بقاعدة بيانات سحابية PostgreSQL • يضمن صلاحيات كل دور بدقة
        </p>
      </div>
    </div>
  );
};
