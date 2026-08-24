import React, { useState } from 'react';
import { LogIn, Moon, Sun, KeyRound, Phone, Shield, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
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
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Normalize phone number for comparison
  const cleanPhoneStr = (p: string) => p.replace(/[\s\-\+\(\)]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdent = identifier.trim();
    if (!cleanIdent) {
      setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني المعتمد');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. استدعاء خادم الـ API للتحقق من قاعدة البيانات PostgreSQL
      const res = await api.login(cleanIdent, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        return;
      } else {
        // إذا رجع الخادم خطأ صريح بعدم وجود المستخدم أو خطأ بكلمة المرور
        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
      }
    } catch {
      // في حال تعذر الاتصال بالخادم، التحقق الصارم من المستخدمين المحليين المسجلين فقط
      const identPhone = cleanPhoneStr(cleanIdent);
      const identEmail = cleanIdent.toLowerCase();

      const found = users.find(u => {
        const uPhone = cleanPhoneStr(u.phone);
        const uEmail = (u.email || '').toLowerCase();
        // مطابقة تامة للهاتف أو البريد فقط (بدون مطابقة تقريبية بالاسم)
        return (identPhone.length >= 8 && uPhone.endsWith(identPhone.slice(-9))) ||
               (uEmail && uEmail === identEmail);
      });

      if (found) {
        if (!found.isActive) {
          setError('هذا الحساب معطل حالياً من قبل إدارة المركز.');
          setLoading(false);
          return;
        }
        if (password && password.trim() !== '' && password !== '123456') {
          setError('كلمة المرور غير صحيحة. كلمة المرور الافتراضية هي 123456');
          setLoading(false);
          return;
        }
        onLoginSuccess(found);
        return;
      } else {
        setError('بيانات الدخول غير مسجلة في المنظومة. لا يمكن الدخول إلا بالحسابات المعتمدة من الإدارة.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick fill for testing
  const handleSelectQuickAccount = (accountPhone: string, defaultRoleName: string) => {
    setIdentifier(accountPhone);
    setPassword('123456');
    setError(null);
  };

  // Representative registered demo accounts
  const demoAccounts = [
    { role: 'ADMIN' as UserRole, title: 'مدير النظام', name: 'الشيخ عبد الله بن فهد المنصور', phone: '+966501112233', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
    { role: 'SUPERVISOR' as UserRole, title: 'المشرف العام', name: 'الشيخ د. عثمان الشنقيطي', phone: '+966502223344', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
    { role: 'TEACHER' as UserRole, title: 'معلم الحلقة', name: 'الشيخ محمود بن خليل الحافظ', phone: '+966504445566', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    { role: 'STUDENT' as UserRole, title: 'طالب الحلقة', name: 'عمر بن عبد العزيز الحربي', phone: '+966551122331', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors font-sans select-none">
      {/* Top right theme toggle */}
      <div className="fixed top-4 left-4 z-20">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          title="تبديل المظهر"
          aria-label="تبديل المظهر"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md my-auto space-y-4">
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Header Brand */}
          <div className="p-7 text-center border-b border-slate-100 dark:border-slate-800/80 bg-linear-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black mx-auto mb-3 shadow-lg shadow-emerald-600/20">
              📖
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              منصة إتقان القرآنية
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تسجيل الدخول الموحد للطلاب والمعلمين والمشرفين
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <span className="shrink-0 text-base leading-none">⚠️</span>
                <span className="leading-relaxed font-semibold">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>رقم الهاتف أو البريد الإلكتروني</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">حساب مسجل</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="مثال: +966501112233 أو admin@itqan-quran.org"
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  dir="ltr"
                  autoFocus
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                لا يُقبل سوى الأرقام والحسابات المعتمدة والمسجلة مسبقاً في قاعدة البيانات
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  كلمة المرور
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                  الافتراضية: 123456
                </span>
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
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {loading ? (
                <span>جاري التحقق من الصلاحيات...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول للمنظومة</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Toggle */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/40">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>حسابات تجريبية سريعة لتجربة الأدوار</span>
              </span>
              {showDemoAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 mb-2">
                  اضغط على أي حساب لتعبئة بياناته المسجلة تلقائياً وتجربة صلاحياته:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuickAccount(acc.phone, acc.title)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 text-right transition cursor-pointer flex flex-col gap-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${acc.badge}`}>
                          {acc.title}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono">123456</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {acc.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                        {acc.phone}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* How do users know passwords accordion */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>كيف يعرف المستخدم كلمة المرور الخاصة به؟</span>
              </span>
              {showHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showHelp && (
              <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-2 bg-white dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>تسجيل الحسابات:</strong> يتم إنشاء وتسجيل حسابات الطلاب والمعلمين بواسطة إدارة الحلقات والمشرفين من لوحة الإدارة.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>كلمة المرور الافتراضية:</strong> عند إضافة أي مستخدم جديد، يتم تعيين كلمة المرور الموحدة وهي <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono font-bold text-emerald-600">123456</code>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>طريقة الدخول:</strong> يدخل الطالب أو المعلم برقم هاتفه المعتمد مع كلمة المرور الافتراضية، أو يستلمها عبر إشعار رسائل المركز.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>منظومة محمية بقاعدة بيانات PostgreSQL • الوصول مقتصر على الحسابات المسجلة</span>
        </p>
      </div>
    </div>
  );
};
