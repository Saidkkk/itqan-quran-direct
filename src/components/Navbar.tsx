import React from 'react';
import { 
  BarChart3, 
  BookOpen, 
  Database, 
  FileCode2, 
  LogOut, 
  Moon, 
  RotateCcw, 
  Shield, 
  Sun, 
  Users 
} from 'lucide-react';
import { User, UserRole } from '../types';

interface NavbarProps {
  currentTab: 'TEACHER_RECORDER' | 'REPORTS' | 'ADMIN' | 'ARCHITECTURE' | 'DOCS';
  setCurrentTab: (tab: 'TEACHER_RECORDER' | 'REPORTS' | 'ADMIN' | 'ARCHITECTURE' | 'DOCS') => void;
  currentUser: User;
  onLogout: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  isDarkMode,
  setIsDarkMode,
  onResetData
}) => {
  // Define permitted tabs by role
  const getNavItemsForRole = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'ADMIN' as const, label: 'إدارة النظام والأدوار' },
          { id: 'TEACHER_RECORDER' as const, label: 'تسجيل الحلقات' },
          { id: 'REPORTS' as const, label: 'التقارير الشاملة' },
          { id: 'ARCHITECTURE' as const, label: 'مخطط البيانات' },
          { id: 'DOCS' as const, label: 'التوثيق البرمجي' }
        ];
      case 'SUPERVISOR':
        return [
          { id: 'REPORTS' as const, label: 'متابعة الحلقات والتقارير' },
          { id: 'TEACHER_RECORDER' as const, label: 'تسجيل ومتابعة الجلسات' }
        ];
      case 'TEACHER':
        return [
          { id: 'TEACHER_RECORDER' as const, label: 'تسجيل حلقاتي' },
          { id: 'REPORTS' as const, label: 'تقارير طلابي' }
        ];
      case 'STUDENT':
        return [
          { id: 'REPORTS' as const, label: 'سجلي القرآني وإنجازاتي' }
        ];
      default:
        return [
          { id: 'REPORTS' as const, label: 'التقارير' }
        ];
    }
  };

  const navItems = getNavItemsForRole(currentUser.role);

  const roleMeta: Record<UserRole, { label: string; bg: string; color: string; icon: string }> = {
    ADMIN: { label: 'مدير النظام', bg: 'bg-rose-100 dark:bg-rose-950/80', color: 'text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: '🛡️' },
    SUPERVISOR: { label: 'مشرف الحلقات', bg: 'bg-blue-100 dark:bg-blue-950/80', color: 'text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: '👳‍♂️' },
    TEACHER: { label: 'معلم الحلقة', bg: 'bg-emerald-100 dark:bg-emerald-950/80', color: 'text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: '👨‍🏫' },
    STUDENT: { label: 'طالب', bg: 'bg-amber-100 dark:bg-amber-950/80', color: 'text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: '👦' }
  };

  const currentRoleInfo = roleMeta[currentUser.role] || roleMeta.TEACHER;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Brand (Single Text Element) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            📖
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white font-cairo whitespace-nowrap">
            منصة إتقان
          </span>
        </div>

        {/* Zone 2: Navigation Links for Authorized Role */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (User Info, Logout, Dark Mode) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Info Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${currentRoleInfo.bg} ${currentRoleInfo.color}`}>
            <span>{currentRoleInfo.icon}</span>
            <span className="truncate max-w-[130px]">{currentUser.name}</span>
            <span className="text-[10px] opacity-75 font-normal">({currentRoleInfo.label})</span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="تبديل المظهر"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition shadow-xs"
            title="تسجيل الخروج والعودة لشاشة الدخول"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Filtered for user's role) */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-1 text-[11px] font-bold">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

