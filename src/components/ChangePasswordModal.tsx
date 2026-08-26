import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, Check, X, ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';

interface ChangePasswordModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  currentUser,
  isOpen,
  onClose
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword || oldPassword.trim() === '') {
      setError('يرجى إدخال كلمة المرور الحالية.');
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setError('كلمة المرور الجديدة يجب أن تتكون من 4 خانات أو أحرف على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword(currentUser.id, oldPassword, newPassword);
      if (res.success) {
        setSuccess('تم تغيير كلمة المرور بنجاح! يرجى استخدام كلمة المرور الجديدة في تسجيلات الدخول القادمة.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 2000);
      } else {
        setError(res.error || 'فشل تغيير كلمة المرور');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              تغيير كلمة المرور
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              الحساب: <strong className="text-slate-700 dark:text-slate-300">{currentUser.name}</strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* كلمة المرور الحالية */}
          <div>
            <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              كلمة المرور الحالية:
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                required
                placeholder="إذا لم تغيرها سابقاً فهي: 123456"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-3 pl-10 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition cursor-pointer"
                title={showOldPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* كلمة المرور الجديدة */}
          <div>
            <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              كلمة المرور الجديدة:
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="أدخل 4 أحرف أو أرقام على الأقل"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-3 pl-10 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition cursor-pointer"
                title={showNewPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* تأكيد كلمة المرور الجديدة */}
          <div>
            <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              تأكيد كلمة المرور الجديدة:
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="أعد كتابة كلمة المرور الجديدة"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-3 pl-10 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition cursor-pointer"
                title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>في حال نسيان كلمة المرور في أي وقت، يمكنك التواصل مع المشرف أو مدير النظام لإعادة ضبطها فوراً.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تحديث كلمة المرور</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
