import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building, 
  Check, 
  Globe, 
  Languages, 
  Plus, 
  Shield, 
  Trash2, 
  UserPlus, 
  Users, 
  X,
  Edit2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  KeyRound
} from 'lucide-react';
import { Country, Dialect, Halaqah, HalaqahSession, StudentEnrollment, User, UserRole } from '../types';
import { api } from '../utils/api';

const WEEK_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

interface AdminManagementProps {
  countries: Country[];
  setCountries: (countries: Country[]) => void;
  halaqat: Halaqah[];
  setHalaqat: (halaqat: Halaqah[]) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  enrollments?: StudentEnrollment[];
  setEnrollments?: (enrollments: StudentEnrollment[]) => void;
  sessions?: HalaqahSession[];
}

export const AdminManagement: React.FC<AdminManagementProps> = ({
  countries,
  setCountries,
  halaqat,
  setHalaqat,
  users,
  setUsers,
  enrollments = [],
  setEnrollments,
  sessions = []
}) => {
  const [activeTab, setActiveTab] = useState<'DEFINITIONS' | 'HALAQAT' | 'USERS'>('HALAQAT');

  // -------------------------------------------------------------
  // Delete Validation & Confirmation Modal State
  // -------------------------------------------------------------
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'COUNTRY' | 'DIALECT' | 'HALAQAH' | 'USER';
    id: string;
    name: string;
    parentCountryId?: string; // for dialect
    isBlocked: boolean;
    blockReasons: string[];
    confirmAction?: () => Promise<void>;
  }>({
    isOpen: false,
    type: 'USER',
    id: '',
    name: '',
    isBlocked: false,
    blockReasons: []
  });

  const [isDeleting, setIsDeleting] = useState(false);

  // -------------------------------------------------------------
  // Country & Dialect State (Add & Edit)
  // -------------------------------------------------------------
  const [isAddCountryModalOpen, setIsAddCountryModalOpen] = useState(false);
  const [newCountryNameAr, setNewCountryNameAr] = useState('');
  const [newCountryNameEn, setNewCountryNameEn] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('');

  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  const [isAddDialectModalOpen, setIsAddDialectModalOpen] = useState(false);
  const [selectedCountryForDialect, setSelectedCountryForDialect] = useState<string>('');
  const [newDialectName, setNewDialectName] = useState('');
  const [newDialectDescription, setNewDialectDescription] = useState('');

  const [editingDialect, setEditingDialect] = useState<{ countryId: string; dialect: Dialect } | null>(null);

  // -------------------------------------------------------------
  // Halaqah State (Add & Edit)
  // -------------------------------------------------------------
  const [isAddHalaqahModalOpen, setIsAddHalaqahModalOpen] = useState(false);
  const [newHalaqahName, setNewHalaqahName] = useState('');
  const [newHalaqahTeacherId, setNewHalaqahTeacherId] = useState('');
  const [newHalaqahSupervisorId, setNewHalaqahSupervisorId] = useState('');
  const [newHalaqahLevel, setNewHalaqahLevel] = useState<'مبتدئ' | 'متوسط' | 'متقدم' | 'إجازة وإتقان'>('متوسط');
  const [newHalaqahTargetJuz, setNewHalaqahTargetJuz] = useState<number>(3);
  const [newHalaqahTime, setNewHalaqahTime] = useState('بعد صلاة العصر');
  const [newHalaqahDays, setNewHalaqahDays] = useState<string[]>(['الأحد', 'الثلاثاء', 'الخميس']);
  const [newHalaqahMaxStudents, setNewHalaqahMaxStudents] = useState<number>(15);

  const [editingHalaqah, setEditingHalaqah] = useState<Halaqah | null>(null);

  // -------------------------------------------------------------
  // User State (Add & Edit)
  // -------------------------------------------------------------
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('STUDENT');
  const [newUserGender, setNewUserGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newUserBirthDate, setNewUserBirthDate] = useState('');
  const [userGenderFilter, setUserGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [newUserCountryId, setNewUserCountryId] = useState(countries[0]?.id || '');
  const [newUserDialectId, setNewUserDialectId] = useState(countries[0]?.dialects[0]?.id || '');
  const [newUserSupervisorId, setNewUserSupervisorId] = useState('');
  const [newUserTeacherId, setNewUserTeacherId] = useState('');
  const [newUserHalaqahId, setNewUserHalaqahId] = useState(halaqat[0]?.id || '');

  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Helper to calculate age from birthDate
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  // Reset Password State (Admin capability)
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('123456');
  const [resetResultMsg, setResetResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResettingUserPass, setIsResettingUserPass] = useState(false);

  // Quick Student Enrollment Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedHalaqahForEnroll, setSelectedHalaqahForEnroll] = useState<Halaqah | null>(null);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState<string>('');

  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const teachers = users.filter(u => u.role === 'TEACHER');
  const supervisors = users.filter(u => u.role === 'SUPERVISOR');
  const students = users.filter(u => u.role === 'STUDENT');

  // =========================================================================
  // DEPENDENCY CHECKERS & DELETE TRIGGERS (فحص التبعيات قبل الحذف)
  // =========================================================================

  // 1. Delete Country Check
  const requestDeleteCountry = (country: Country) => {
    const linkedUsers = users.filter(u => 
      u.countryId === country.id || 
      u.countryId === country.code || 
      u.countryId === `cnt-${country.code.toLowerCase()}`
    );
    const linkedDialects = country.dialects || [];

    const blockReasons: string[] = [];
    if (linkedUsers.length > 0) {
      blockReasons.push(`يوجد ${linkedUsers.length} مستخدم مسجل مرتبط بهذه الدولة (${linkedUsers.slice(0, 3).map(u => u.name).join('، ')}${linkedUsers.length > 3 ? '...' : ''}).`);
    }
    if (linkedDialects.length > 0) {
      blockReasons.push(`يوجد ${linkedDialects.length} لهجة مسجلة تابعة لهذه الدولة (${linkedDialects.map(d => d.name).join('، ')}).`);
    }

    setDeleteDialog({
      isOpen: true,
      type: 'COUNTRY',
      id: country.id,
      name: country.nameAr,
      isBlocked: blockReasons.length > 0,
      blockReasons,
      confirmAction: async () => {
        await api.deleteCountry(country.id);
        setCountries(countries.filter(c => c.id !== country.id));
      }
    });
  };

  // 2. Delete Dialect Check
  const requestDeleteDialect = (countryId: string, dialect: Dialect) => {
    const linkedUsers = users.filter(u => u.dialectId === dialect.id);
    const blockReasons: string[] = [];

    if (linkedUsers.length > 0) {
      blockReasons.push(`يوجد ${linkedUsers.length} مستخدم مسجل مرتبط بهذه اللهجة (${linkedUsers.slice(0, 3).map(u => u.name).join('، ')}${linkedUsers.length > 3 ? '...' : ''}).`);
    }

    setDeleteDialog({
      isOpen: true,
      type: 'DIALECT',
      id: dialect.id,
      name: dialect.name,
      parentCountryId: countryId,
      isBlocked: blockReasons.length > 0,
      blockReasons,
      confirmAction: async () => {
        try {
          await api.deleteDialect(dialect.id);
        } catch {
          // fallback if offline
        }
        setCountries(countries.map(c => {
          if (c.id === countryId) {
            return { ...c, dialects: c.dialects.filter(d => d.id !== dialect.id) };
          }
          return c;
        }));
      }
    });
  };

  // 3. Delete Halaqah Check
  const requestDeleteHalaqah = (hlq: Halaqah) => {
    const linkedEnrollments = enrollments.filter(e => e.circleId === hlq.id);
    const linkedSessions = sessions.filter(s => s.circleId === hlq.id);
    const enrolledStudentNames = students
      .filter(s => linkedEnrollments.some(e => e.studentId === s.id))
      .map(s => s.name);

    const blockReasons: string[] = [];
    if (linkedEnrollments.length > 0) {
      blockReasons.push(`يوجد ${linkedEnrollments.length} طالب مسجل بهذه الحلقة (${enrolledStudentNames.slice(0, 3).join('، ')}${enrolledStudentNames.length > 3 ? '...' : ''}). يرجى إلغاء تسجيلهم أو نقلهم لحلقة أخرى أولاً.`);
    }
    if (linkedSessions.length > 0) {
      blockReasons.push(`يوجد ${linkedSessions.length} جلسة تسميع وتقييم موثقة مرتبطة بهذه الحلقة.`);
    }

    setDeleteDialog({
      isOpen: true,
      type: 'HALAQAH',
      id: hlq.id,
      name: hlq.name,
      isBlocked: blockReasons.length > 0,
      blockReasons,
      confirmAction: async () => {
        await api.deleteHalaqah(hlq.id);
        setHalaqat(halaqat.filter(h => h.id !== hlq.id));
      }
    });
  };

  // 4. Delete User Check
  const requestDeleteUser = (user: User) => {
    const blockReasons: string[] = [];

    // Check if Teacher assigned to halaqat
    if (user.role === 'TEACHER') {
      const assignedHalaqat = halaqat.filter(h => h.teacherId === user.id);
      if (assignedHalaqat.length > 0) {
        blockReasons.push(`هذا المعلم مسؤول حالياً عن ${assignedHalaqat.length} حلقة (${assignedHalaqat.map(h => h.name).join('، ')}). يرجى تعيين معلم بديل للحلقات قبل الحذف.`);
      }
    }

    // Check if Supervisor assigned to halaqat or users
    if (user.role === 'SUPERVISOR') {
      const supervisedHalaqat = halaqat.filter(h => h.supervisorId === user.id);
      const supervisedUsers = users.filter(u => u.supervisorId === user.id);
      if (supervisedHalaqat.length > 0) {
        blockReasons.push(`هذا المشرف يتابع حالياً ${supervisedHalaqat.length} حلقة (${supervisedHalaqat.map(h => h.name).join('، ')}). يرجى تغيير المشرف في الحلقات أولاً.`);
      }
      if (supervisedUsers.length > 0) {
        blockReasons.push(`يوجد ${supervisedUsers.length} معلم/مستخدم مسند لهذا المشرف.`);
      }
    }

    // Check if Student enrolled in halaqat
    if (user.role === 'STUDENT') {
      const studentEnrs = enrollments.filter(e => e.studentId === user.id);
      if (studentEnrs.length > 0) {
        const circleNames = studentEnrs
          .map(e => halaqat.find(h => h.id === e.circleId)?.name)
          .filter(Boolean);
        blockReasons.push(`الطالب مسجل حالياً في ${studentEnrs.length} حلقة (${circleNames.join('، ')}). يرجى إلغاء تسجيله من الحلقة أولاً.`);
      }
    }

    // Check if Admin (cannot delete last admin)
    if (user.role === 'ADMIN') {
      const adminCount = users.filter(u => u.role === 'ADMIN').length;
      if (adminCount <= 1) {
        blockReasons.push(`لا يمكن حذف آخر مدير نظام في المنصة لضمان استمرارية التحكم.`);
      }
    }

    setDeleteDialog({
      isOpen: true,
      type: 'USER',
      id: user.id,
      name: `${user.name} (${user.role})`,
      isBlocked: blockReasons.length > 0,
      blockReasons,
      confirmAction: async () => {
        await api.deleteUser(user.id);
        setUsers(users.filter(u => u.id !== user.id));
      }
    });
  };

  // Execute Confirmed Delete
  const handleExecuteDelete = async () => {
    if (!deleteDialog.confirmAction || deleteDialog.isBlocked) return;
    setIsDeleting(true);
    try {
      await deleteDialog.confirmAction();
      setDeleteDialog(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================================
  // CRUD HANDLERS
  // =========================================================================

  // Country Handlers
  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryNameAr.trim()) return;

    const payload = {
      nameAr: newCountryNameAr.trim(),
      nameEn: newCountryNameEn.trim() || 'Country',
      code: newCountryCode.trim().toUpperCase() || `C${Date.now().toString().slice(-4)}`,
      dialects: []
    };

    const savedCountry = await api.createCountry(payload);
    setCountries([...countries, savedCountry]);
    setNewCountryNameAr('');
    setNewCountryNameEn('');
    setNewCountryCode('');
    setIsAddCountryModalOpen(false);
  };

  const handleUpdateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry || !editingCountry.nameAr.trim()) return;

    try {
      const updated = await api.updateCountry(editingCountry.id, {
        nameAr: editingCountry.nameAr.trim(),
        nameEn: editingCountry.nameEn?.trim() || '',
        code: editingCountry.code.trim().toUpperCase()
      });
      setCountries(countries.map(c => c.id === editingCountry.id ? { ...c, ...updated } : c));
      setEditingCountry(null);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث بيانات الدولة');
    }
  };

  // Dialect Handlers
  const handleAddDialect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDialectName.trim() || !selectedCountryForDialect) return;

    const newDialectData = {
      countryId: selectedCountryForDialect,
      name: newDialectName.trim(),
      code: newDialectName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: newDialectDescription.trim()
    };

    let savedDialect: Dialect = {
      id: `dia-${Date.now()}`,
      ...newDialectData
    };

    try {
      const res = await api.createDialect(newDialectData);
      if (res && res.id) savedDialect = res;
    } catch {
      // offline fallback
    }

    setCountries(countries.map(c => {
      if (c.id === selectedCountryForDialect) {
        return { ...c, dialects: [...c.dialects, savedDialect] };
      }
      return c;
    }));

    setNewDialectName('');
    setNewDialectDescription('');
    setIsAddDialectModalOpen(false);
  };

  const handleUpdateDialect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDialect || !editingDialect.dialect.name.trim()) return;

    const { countryId, dialect } = editingDialect;
    try {
      await api.updateDialect(dialect.id, {
        name: dialect.name.trim(),
        code: dialect.code,
        description: dialect.description
      });
    } catch {
      // fallback
    }

    setCountries(countries.map(c => {
      if (c.id === countryId) {
        return {
          ...c,
          dialects: c.dialects.map(d => d.id === dialect.id ? dialect : d)
        };
      }
      return c;
    }));

    setEditingDialect(null);
  };

  // Halaqah Handlers
  const handleAddHalaqah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHalaqahName.trim()) return;

    try {
      const payload = {
        name: newHalaqahName.trim(),
        code: `HLQ-${Date.now().toString().slice(-4)}`,
        teacherId: newHalaqahTeacherId || teachers[0]?.id || 'usr-tch-1',
        supervisorId: newHalaqahSupervisorId || supervisors[0]?.id || 'usr-sup-1',
        scheduleDays: newHalaqahDays.length > 0 ? newHalaqahDays : ['الأحد', 'الثلاثاء', 'الخميس'],
        timeSlot: newHalaqahTime || 'بعد صلاة العصر',
        targetJuz: newHalaqahTargetJuz,
        level: newHalaqahLevel,
        maxStudents: newHalaqahMaxStudents || 15,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0]
      };

      const savedHlq = await api.createHalaqah(payload);
      setHalaqat([...halaqat, savedHlq]);
      setNewHalaqahName('');
      setIsAddHalaqahModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ الحلقة');
    }
  };

  const handleUpdateHalaqah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHalaqah || !editingHalaqah.name.trim()) return;

    try {
      const updated = await api.updateHalaqah(editingHalaqah.id, editingHalaqah);
      setHalaqat(halaqat.map(h => h.id === editingHalaqah.id ? { ...h, ...updated } : h));
      setEditingHalaqah(null);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث بيانات الحلقة');
    }
  };

  // User Handlers
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError(null);
    if (!newUserName.trim() || !newUserPhone.trim()) {
      setUserActionError('الاسم ورقم الهاتف حقول مطلوبة');
      return;
    }

    setIsSubmittingUser(true);
    try {
      const targetTeacherId = newUserRole === 'STUDENT'
        ? (halaqat.find(h => h.id === newUserHalaqahId)?.teacherId || newUserTeacherId || teachers[0]?.id)
        : undefined;

      const payload = {
        name: newUserName.trim(),
        email: newUserEmail.trim() || `${Date.now()}@itqan-quran.org`,
        phone: newUserPhone.trim(),
        role: newUserRole,
        gender: newUserGender,
        birthDate: newUserBirthDate.trim() || undefined,
        countryId: newUserCountryId || countries[0]?.id || '',
        dialectId: newUserDialectId || '',
        supervisorId: newUserRole === 'TEACHER' ? (newUserSupervisorId || supervisors[0]?.id) : undefined,
        teacherId: targetTeacherId,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        currentJuz: newUserRole === 'STUDENT' ? 30 : undefined,
        currentSurah: newUserRole === 'STUDENT' ? 78 : undefined
      };

      const savedUser = await api.createUser(payload);

      // ربط الطالب بالحلقة المختارة فوراً
      if (newUserRole === 'STUDENT' && newUserHalaqahId && setEnrollments) {
        try {
          const newEnrollment = await api.createEnrollment({
            circleId: newUserHalaqahId,
            studentId: savedUser.id,
            status: 'ACTIVE'
          });
          setEnrollments([...enrollments, newEnrollment]);
        } catch (enrErr) {
          console.warn('Auto enrollment error:', enrErr);
        }
      }

      // تحديث القائمة فورياً من قاعدة البيانات
      const refreshedUsers = await api.getUsers();
      setUsers(refreshedUsers.length ? refreshedUsers : [...users, savedUser]);
      
      setNewUserName('');
      setNewUserPhone('');
      setNewUserEmail('');
      setNewUserGender('MALE');
      setNewUserBirthDate('');
      setIsAddUserModalOpen(false);
    } catch (err: any) {
      setUserActionError(err.message || 'فشل حفظ المستخدم في قاعدة البيانات');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name.trim() || !editingUser.phone.trim()) return;

    try {
      const updated = await api.updateUser(editingUser.id, {
        name: editingUser.name.trim(),
        phone: editingUser.phone.trim(),
        email: editingUser.email?.trim(),
        role: editingUser.role,
        gender: editingUser.gender || 'MALE',
        birthDate: editingUser.birthDate || undefined,
        isActive: editingUser.isActive
      });

      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || 'فشل تعديل بيانات المستخدم');
    }
  };

  // Quick Student Enrollment to Circle
  const handleEnrollExistingStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHalaqahForEnroll || !selectedStudentToEnroll) return;

    try {
      const newEnr = await api.createEnrollment({
        circleId: selectedHalaqahForEnroll.id,
        studentId: selectedStudentToEnroll,
        status: 'ACTIVE'
      });

      if (setEnrollments) {
        setEnrollments([...enrollments.filter(x => !(x.circleId === selectedHalaqahForEnroll.id && x.studentId === selectedStudentToEnroll)), newEnr]);
      }
      setIsEnrollModalOpen(false);
      setSelectedStudentToEnroll('');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تسجيل الطالب في الحلقة');
    }
  };

  const handleUnenrollStudent = async (enrollmentId: string, circleId: string, studentId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في إلغاء تسجيل هذا الطالب من الحلقة؟')) return;

    try {
      if (enrollmentId) {
        await api.deleteEnrollment(enrollmentId);
      }
      if (setEnrollments) {
        setEnrollments(enrollments.filter(e => !(e.circleId === circleId && e.studentId === studentId)));
      }
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء التسجيل');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    const updatedStatus = !userToUpdate.isActive;
    
    setUsers(users.map(u => u.id === userId ? { ...u, isActive: updatedStatus } : u));
    
    try {
      await api.updateUser(userId, { isActive: updatedStatus });
    } catch (e) {
      console.error('Failed to update user status in DB', e);
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: userToUpdate.isActive } : u));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              لوحة تحكم مدير النظام والتعريفات الأساسية
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة وتعديل وحذف الدول واللهجات والحلقات والمستخدمين مع فحص محكم للتبعيات والروابط
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('DEFINITIONS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'DEFINITIONS'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>الدول واللهجات ({countries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HALAQAT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'HALAQAT'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>إدارة الحلقات ({halaqat.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'USERS'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمين والأدوار ({users.length})</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: الدول واللهجات (Countries & Dialects)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'DEFINITIONS' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-emerald-600" />
              <span>قائمة الدول واللهجات المعتمدة بالنظام</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCountryForDialect(countries[0]?.id || '');
                  setIsAddDialectModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة لهجة جديدة</span>
              </button>

              <button
                onClick={() => setIsAddCountryModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة دولة</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countries.map(country => (
              <div
                key={country.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 relative group"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-xs">
                      {country.code}
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {country.nameAr}
                      </h4>
                      {country.nameEn && (
                        <span className="text-[11px] text-slate-400 font-mono block">{country.nameEn}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Country: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingCountry(country)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="تعديل بيانات الدولة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => requestDeleteCountry(country)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="حذف الدولة (مع فحص التبعيات)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dialects list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>اللهجات التابعة ({country.dialects.length}):</span>
                    <button
                      onClick={() => {
                        setSelectedCountryForDialect(country.id);
                        setIsAddDialectModalOpen(true);
                      }}
                      className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة لهجة</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {country.dialects.map(d => (
                      <div
                        key={d.id}
                        className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs flex items-center justify-between gap-3 group/dialect"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {d.name}
                          </span>
                          {d.description && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {d.description}
                            </span>
                          )}
                        </div>

                        {/* Dialect Actions */}
                        <div className="flex items-center gap-0.5 opacity-80 group-hover/dialect:opacity-100">
                          <button
                            onClick={() => setEditingDialect({ countryId: country.id, dialect: d })}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                            title="تعديل اللهجة"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => requestDeleteDialect(country.id, d)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="حذف اللهجة (مع فحص التبعيات)"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {country.dialects.length === 0 && (
                      <span className="text-xs text-slate-400 italic">لا توجد لهجات مسجلة بعد</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: إدارة الحلقات القرآنية وتنسيب الطلاب
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'HALAQAT' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>قائمة الحلقات القرآنية وتوزيع الطلاب</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يمكنك من هنا تعديل مواعيد ومستهدفات الحلقات، حذف الحلقات بعد التأكد من خلوها من الطلاب، وتنسيب الطلاب.
              </p>
            </div>

            <button
              onClick={() => {
                setNewHalaqahTeacherId(teachers[0]?.id || '');
                setNewHalaqahSupervisorId(supervisors[0]?.id || '');
                setIsAddHalaqahModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء حلقة جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {halaqat.map(h => {
              const teacher = users.find(u => u.id === h.teacherId);
              const supervisor = users.find(u => u.id === h.supervisorId);

              // الطلاب المنتمون لهذه الحلقة
              const circleEnrollments = enrollments.filter(e => e.circleId === h.id);
              const circleStudentIds = circleEnrollments.map(e => e.studentId);
              const enrolledStudents = students.filter(s => circleStudentIds.includes(s.id));
              const circleSessionsCount = sessions.filter(s => s.circleId === h.id).length;

              return (
                <div
                  key={h.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${h.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">
                          {h.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                        {h.code} • المستوى: {h.level} • {circleSessionsCount} جلسة موثقة
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                        مستهدف: {h.targetJuz} أجزاء
                      </span>

                      <button
                        onClick={() => setEditingHalaqah(h)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="تعديل بيانات الحلقة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => requestDeleteHalaqah(h)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="حذف الحلقة (مع فحص التبعيات)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2.5 text-xs">
                    {/* المعلم المسؤول */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>المعلم المسؤول:</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {teacher?.name || 'غير معين'}
                      </span>
                    </div>

                    {/* المشرف العام */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>المشرف العام:</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {supervisor?.name || 'غير معين'}
                      </span>
                    </div>

                    {/* أيام الحلقة */}
                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>أيام انعقاد الحلقة:</span>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          {h.scheduleDays && h.scheduleDays.length > 0 ? `${h.scheduleDays.length} أيام في الأسبوع` : 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {h.scheduleDays && h.scheduleDays.length > 0 ? (
                          h.scheduleDays.map((day, dIdx) => (
                            <span
                              key={dIdx}
                              className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-md text-[11px] font-bold"
                            >
                              {day}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">لم يتم تحديد أيام</span>
                        )}
                      </div>
                    </div>

                    {/* وقت الحلقة */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>وقت وموعد الحلقة:</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                        {h.timeSlot || 'بعد صلاة العصر'}
                      </span>
                    </div>

                    {/* الحد الأقصى للطلاب */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>الحد الأقصى للطلاب (السعة):</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold px-2.5 py-0.5 rounded-md text-[11px] ${
                          enrolledStudents.length >= (h.maxStudents || 15)
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {enrolledStudents.length} / {h.maxStudents || 15} طالب
                        </span>
                        {enrolledStudents.length >= (h.maxStudents || 15) ? (
                          <span className="text-[10px] text-rose-600 font-bold">مكتملة</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            (متاح {(h.maxStudents || 15) - enrolledStudents.length} مقاعد)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* قسم الطلاب الملتحقين بالحلقة */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>الطلاب المسجلون بالحلقة ({enrolledStudents.length}/{h.maxStudents})</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedHalaqahForEnroll(h);
                          setSelectedStudentToEnroll(students.find(s => !circleStudentIds.includes(s.id))?.id || '');
                          setIsEnrollModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ تسجيل طالب في الحلقة</span>
                      </button>
                    </div>

                    {enrolledStudents.length === 0 ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                        لا يوجد طلاب مسجلون في هذه الحلقة حالياً. اضغط على "+ تسجيل طالب في الحلقة" لربط طالب بها.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {enrolledStudents.map(st => {
                          const enr = circleEnrollments.find(e => e.studentId === st.id);
                          return (
                            <div
                              key={st.id}
                              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{st.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{st.phone}</span>
                              </div>

                              <button
                                onClick={() => handleUnenrollStudent(enr?.id || '', h.id, st.id)}
                                className="text-slate-400 hover:text-rose-600 transition text-[11px] p-1"
                                title="إلغاء تسجيل الطالب من هذه الحلقة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: المستخدمين والأدوار (Users & RBAC)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'USERS' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* إحصائيات سريعة للمستخدمين والجنس */}
          {(() => {
            const maleCount = users.filter(u => (u.gender || 'MALE') === 'MALE').length;
            const femaleCount = users.filter(u => u.gender === 'FEMALE').length;
            const studentAges = users
              .filter(u => u.role === 'STUDENT' && u.birthDate)
              .map(u => calculateAge(u.birthDate))
              .filter((age): age is number => age !== null);
            const avgStudentAge = studentAges.length > 0
              ? (studentAges.reduce((acc, a) => acc + a, 0) / studentAges.length).toFixed(1)
              : null;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">إجمالي المستخدمين</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{users.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{students.length} طالب • {teachers.length} معلم</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-xs">
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center justify-between">
                    <span>بنين (ذكور) 👨</span>
                    <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                      {users.length > 0 ? Math.round((maleCount / users.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">{maleCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">من إجمالي المستخدمين</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center justify-between">
                    <span>بنات (إناث) 👩</span>
                    <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                      {users.length > 0 ? Math.round((femaleCount / users.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">{femaleCount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">من إجمالي المستخدمين</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">متوسط أعمار الطلاب</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    {avgStudentAge ? `${avgStudentAge} سنة` : 'غير متوفر'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{studentAges.length} طالب محدد تاريخ ميلاده</div>
                </div>
              </div>
            );
          })()}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>دليل المستخدمين وإدارة الصلاحيات (RBAC)</span>
              </h3>

              {/* أزرار تصفية الجنس */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setUserGenderFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    userGenderFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setUserGenderFilter('MALE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    userGenderFilter === 'MALE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-blue-600 dark:text-slate-400'
                  }`}
                >
                  <span>بنين (ذكور)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserGenderFilter('FEMALE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    userGenderFilter === 'FEMALE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-rose-600 dark:text-slate-400'
                  }`}
                >
                  <span>بنات (إناث)</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setNewUserRole('STUDENT');
                setNewUserGender('MALE');
                setNewUserBirthDate('');
                setNewUserHalaqahId(halaqat[0]?.id || '');
                setIsAddUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">الاسم والمستخدم</th>
                    <th className="p-3">الجنس وتاريخ الميلاد</th>
                    <th className="p-3">الدور / الصلاحية</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">الحلقة القرآنية المرتبطة</th>
                    <th className="p-3">الدولة واللهجة</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users
                    .filter(u => {
                      if (userGenderFilter === 'ALL') return true;
                      const uGen = u.gender || 'MALE';
                      return uGen === userGenderFilter;
                    })
                    .map(u => {
                    const country = countries.find(c => c.id === u.countryId || c.code === u.countryId);
                    const dialect = country?.dialects.find(d => d.id === u.dialectId);

                    const studentEnrs = enrollments.filter(e => e.studentId === u.id);
                    const studentHalaqatNames = studentEnrs
                      .map(e => halaqat.find(h => h.id === e.circleId)?.name)
                      .filter(Boolean);

                    const roleBadges: Record<UserRole, { label: string; color: string }> = {
                      ADMIN: { label: 'مدير النظام (Admin)', color: 'bg-rose-100 text-rose-800 border-rose-200' },
                      SUPERVISOR: { label: 'مشرف (Supervisor)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                      TEACHER: { label: 'معلم (Teacher)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                      STUDENT: { label: 'طالب (Student)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
                    };

                    const isFemale = u.gender === 'FEMALE';
                    const age = calculateAge(u.birthDate);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {u.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit ${
                              isFemale 
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900' 
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                            }`}>
                              <span>{isFemale ? '👩 أنثى (بنات)' : '👨 ذكر (بنين)'}</span>
                            </span>
                            {u.birthDate ? (
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{u.birthDate}</span>
                                {age !== null && (
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-500 dark:text-slate-400 font-sans">
                                    ({age} سنة)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">تاريخ الميلاد غير مسجل</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${roleBadges[u.role].color}`}>
                            {roleBadges[u.role].label}
                          </span>
                        </td>
                        <td className="p-3 font-mono" dir="ltr">{u.phone}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {u.role === 'STUDENT' ? (
                            studentHalaqatNames.length > 0 ? (
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-block text-[11px]">
                                {studentHalaqatNames.join('، ')}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">غير مسجل بحلقة</span>
                            )
                          ) : u.role === 'TEACHER' ? (
                            <span className="text-xs text-slate-500">
                              {halaqat.filter(h => h.teacherId === u.id).map(h => h.name).join('، ') || 'معلم بدون حلقات'}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div>{country?.nameAr || 'غير محدد'}</div>
                          <div className="text-[11px] text-slate-400">{dialect?.name || '-'}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {u.isActive ? 'نشط' : 'معطل'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setResettingUser(u);
                                setResetPasswordValue('123456');
                                setResetResultMsg(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                              title="إعادة ضبط وتعيين كلمة المرور"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                              title="تعديل بيانات المستخدم"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                u.isActive
                                  ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {u.isActive ? 'تعطيل' : 'تفعيل'}
                            </button>

                            <button
                              onClick={() => requestDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="حذف المستخدم (مع فحص التبعيات)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          GLOBAL DELETE VALIDATION & CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-5 shadow-2xl text-right">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  deleteDialog.isBlocked 
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600' 
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                }`}>
                  {deleteDialog.isBlocked ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Trash2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {deleteDialog.isBlocked ? 'تعذر الحذف لوجود بيانات مرتبطة' : 'تأكيد الحذف النهائي'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    العنصر المحدد: <strong className="text-slate-800 dark:text-slate-200">{deleteDialog.name}</strong>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            {deleteDialog.isBlocked ? (
              <div className="space-y-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>لا يمكن حذف هذا العنصر حالياً للأسباب التالية:</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-amber-900 dark:text-amber-200 pr-1 leading-relaxed">
                  {deleteDialog.blockReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1 border-t border-amber-200 dark:border-amber-900/50">
                  💡 لحذف هذا السجل بأمان، يرجى تعديل أو نقل السجلات التابعة له أولاً.
                </p>
              </div>
            ) : (
              <div className="space-y-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تم فحص السجل: لا توجد أية بيانات مرتبطة تمنع الحذف.</span>
                </div>
                <p className="text-rose-700 dark:text-rose-300 leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف ({deleteDialog.name}) نهائياً من قاعدة بيانات النظام؟ هذا الإجراء لا يمكن التراجع عنه.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                {deleteDialog.isBlocked ? 'إغلاق وفهمت ذلك' : 'إلغاء'}
              </button>

              {!deleteDialog.isBlocked && (
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
                >
                  {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف نهائياً'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EDIT MODAL: COUNTRY (تعديل الدولة)
      ───────────────────────────────────────────────────────────── */}
      {editingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleUpdateCountry} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">تعديل بيانات الدولة</h4>
              <button type="button" onClick={() => setEditingCountry(null)}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">اسم الدولة بالعربية:</label>
              <input
                type="text"
                required
                value={editingCountry.nameAr}
                onChange={e => setEditingCountry({ ...editingCountry, nameAr: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">الاسم بالإنجليزية:</label>
              <input
                type="text"
                value={editingCountry.nameEn || ''}
                onChange={e => setEditingCountry({ ...editingCountry, nameEn: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">رمز الدولة (Code):</label>
              <input
                type="text"
                required
                value={editingCountry.code}
                onChange={e => setEditingCountry({ ...editingCountry, code: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs font-mono outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingCountry(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">حفظ التعديلات</button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EDIT MODAL: DIALECT (تعديل اللهجة)
      ───────────────────────────────────────────────────────────── */}
      {editingDialect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleUpdateDialect} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">تعديل بيانات اللهجة</h4>
              <button type="button" onClick={() => setEditingDialect(null)}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">اسم اللهجة:</label>
              <input
                type="text"
                required
                value={editingDialect.dialect.name}
                onChange={e => setEditingDialect({
                  ...editingDialect,
                  dialect: { ...editingDialect.dialect, name: e.target.value }
                })}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">الوصف أو النطاق:</label>
              <input
                type="text"
                value={editingDialect.dialect.description || ''}
                onChange={e => setEditingDialect({
                  ...editingDialect,
                  dialect: { ...editingDialect.dialect, description: e.target.value }
                })}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingDialect(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">حفظ التعديلات</button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EDIT MODAL: HALAQAH (تعديل الحلقة)
      ───────────────────────────────────────────────────────────── */}
      {editingHalaqah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleUpdateHalaqah} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">تعديل بيانات الحلقة القرآنية</h4>
              <button type="button" onClick={() => setEditingHalaqah(null)}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">اسم الحلقة:</label>
              <input
                type="text"
                required
                value={editingHalaqah.name}
                onChange={e => setEditingHalaqah({ ...editingHalaqah, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            {/* أيام انعقاد الحلقة */}
            <div>
              <label className="text-xs font-semibold block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>أيام انعقاد الحلقة (اضغط لاختيار أو إلغاء الأيام):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  المحدد: {(editingHalaqah.scheduleDays || []).length} أيام
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WEEK_DAYS.map(day => {
                  const isSelected = editingHalaqah.scheduleDays?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const currentDays = editingHalaqah.scheduleDays || [];
                        const newDays = isSelected
                          ? currentDays.filter(d => d !== day)
                          : [...currentDays, day];
                        setEditingHalaqah({ ...editingHalaqah, scheduleDays: newDays });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-40" />}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">المعلم المسؤول:</label>
                <select
                  value={editingHalaqah.teacherId}
                  onChange={e => setEditingHalaqah({ ...editingHalaqah, teacherId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">المشرف المتابع:</label>
                <select
                  value={editingHalaqah.supervisorId}
                  onChange={e => setEditingHalaqah({ ...editingHalaqah, supervisorId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                >
                  {supervisors.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">المستوى:</label>
                <select
                  value={editingHalaqah.level}
                  onChange={e => setEditingHalaqah({ ...editingHalaqah, level: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                >
                  <option value="مبتدئ">مبتدئ</option>
                  <option value="متوسط">متوسط</option>
                  <option value="متقدم">متقدم</option>
                  <option value="إجازة وإتقان">إجازة وإتقان</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">مستهدف الأجزاء:</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editingHalaqah.targetJuz}
                  onChange={e => setEditingHalaqah({ ...editingHalaqah, targetJuz: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>وقت الحلقة:</span>
                </label>
                <input
                  type="text"
                  value={editingHalaqah.timeSlot}
                  placeholder="مثلاً: بعد صلاة العصر"
                  onChange={e => setEditingHalaqah({ ...editingHalaqah, timeSlot: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الحد الأقصى للطلاب:</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editingHalaqah.maxStudents || 15}
                  onChange={e => setEditingHalaqah({ ...editingHalaqah, maxStudents: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">حالة الحلقة:</label>
              <select
                value={editingHalaqah.isActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={e => setEditingHalaqah({ ...editingHalaqah, isActive: e.target.value === 'ACTIVE' })}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs font-bold outline-none"
              >
                <option value="ACTIVE">نشطة (مفعلة)</option>
                <option value="INACTIVE">متوقفة مؤقتاً</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingHalaqah(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">حفظ التعديلات</button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EDIT MODAL: USER (تعديل المستخدم)
      ───────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleUpdateUser} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">تعديل بيانات المستخدم والدور</h4>
              <button type="button" onClick={() => setEditingUser(null)}><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">الاسم:</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  required
                  value={editingUser.phone}
                  onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            {/* الجنس وتاريخ الميلاد */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">الجنس:</label>
                <select
                  value={editingUser.gender || 'MALE'}
                  onChange={e => setEditingUser({ ...editingUser, gender: e.target.value as 'MALE' | 'FEMALE' })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  <option value="MALE">👨 ذكر (بنين)</option>
                  <option value="FEMALE">👩 أنثى (بنات)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  تاريخ الميلاد:
                  {editingUser.birthDate && calculateAge(editingUser.birthDate) !== null && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1.5">
                      (العمر: {calculateAge(editingUser.birthDate)} سنة)
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={editingUser.birthDate || ''}
                  onChange={e => setEditingUser({ ...editingUser, birthDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">الدور (Role):</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  <option value="STUDENT">طالب (Student)</option>
                  <option value="TEACHER">معلم (Teacher)</option>
                  <option value="SUPERVISOR">مشرف (Supervisor)</option>
                  <option value="ADMIN">مدير النظام (Admin)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">حالة الحساب:</label>
              <select
                value={editingUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={e => setEditingUser({ ...editingUser, isActive: e.target.value === 'ACTIVE' })}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs font-bold outline-none"
              >
                <option value="ACTIVE">نشط (مفعل)</option>
                <option value="INACTIVE">معطل</option>
              </select>
            </div>

            {/* زر إعادة ضبط كلمة المرور مباشرة من نافذة التعديل */}
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                <span>إعادة ضبط كلمة المرور للحساب</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const targetUser = editingUser;
                  setEditingUser(null);
                  setResettingUser(targetUser);
                  setResetPasswordValue('123456');
                  setResetResultMsg(null);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer"
              >
                إعادة التعيين 🔑
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">حفظ التعديلات</button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ADD MODALS
      ───────────────────────────────────────────────────────────── */}

      {/* 1. Modal تسجيل طالب في حلقة */}
      {isEnrollModalOpen && selectedHalaqahForEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleEnrollExistingStudent} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">تسجيل طالب في ({selectedHalaqahForEnroll.name})</h4>
              <button type="button" onClick={() => setIsEnrollModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">اختر الطالب:</label>
              <select
                required
                value={selectedStudentToEnroll}
                onChange={e => setSelectedStudentToEnroll(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs font-bold outline-none"
              >
                <option value="">-- اختر طالباً --</option>
                {students.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">تأكيد التسجيل في الحلقة</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add Country Modal */}
      {isAddCountryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleAddCountry} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">إضافة دولة جديدة</h4>
              <button type="button" onClick={() => setIsAddCountryModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">اسم الدولة بالعربية:</label>
              <input
                type="text"
                required
                placeholder="مثلاً: دولة الكويت"
                value={newCountryNameAr}
                onChange={e => setNewCountryNameAr(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">رمز الدولة (ISO 2):</label>
              <input
                type="text"
                placeholder="مثلاً: KW"
                value={newCountryCode}
                onChange={e => setNewCountryCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddCountryModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">حفظ الدولة</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Add Dialect Modal */}
      {isAddDialectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleAddDialect} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">إضافة لهجة تابعة لدولة</h4>
              <button type="button" onClick={() => setIsAddDialectModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">اختر الدولة:</label>
              <select
                value={selectedCountryForDialect}
                onChange={e => setSelectedCountryForDialect(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              >
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.nameAr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">اسم اللهجة:</label>
              <input
                type="text"
                required
                placeholder="مثلاً: الحجازية أو النجدية أو السكندرية"
                value={newDialectName}
                onChange={e => setNewDialectName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">وصف أو نطاق اللهجة:</label>
              <input
                type="text"
                placeholder="وصف اختياري للمنطقة..."
                value={newDialectDescription}
                onChange={e => setNewDialectDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddDialectModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">حفظ اللهجة</button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Add Halaqah Modal */}
      {isAddHalaqahModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleAddHalaqah} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">إنشاء حلقة تحفيظ جديدة</h4>
              <button type="button" onClick={() => setIsAddHalaqahModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">اسم الحلقة:</label>
              <input
                type="text"
                required
                placeholder="مثلاً: حلقة الإمام الكسائي"
                value={newHalaqahName}
                onChange={e => setNewHalaqahName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            {/* اختيار أيام الحلقة */}
            <div>
              <label className="text-xs font-semibold block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>أيام انعقاد الحلقة:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  المحدد: {newHalaqahDays.length} أيام
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WEEK_DAYS.map(day => {
                  const isSelected = newHalaqahDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setNewHalaqahDays(newHalaqahDays.filter(d => d !== day));
                        } else {
                          setNewHalaqahDays([...newHalaqahDays, day]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-40" />}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">المعلم المسؤول:</label>
                <select
                  value={newHalaqahTeacherId}
                  onChange={e => setNewHalaqahTeacherId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">المشرف المتابع:</label>
                <select
                  value={newHalaqahSupervisorId}
                  onChange={e => setNewHalaqahSupervisorId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                >
                  {supervisors.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">المستوى:</label>
                <select
                  value={newHalaqahLevel}
                  onChange={e => setNewHalaqahLevel(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                >
                  <option value="مبتدئ">مبتدئ</option>
                  <option value="متوسط">متوسط</option>
                  <option value="متقدم">متقدم</option>
                  <option value="إجازة وإتقان">إجازة وإتقان</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">مستهدف الأجزاء:</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newHalaqahTargetJuz}
                  onChange={e => setNewHalaqahTargetJuz(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>وقت وموعد الحلقة:</span>
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: بعد صلاة العصر"
                  value={newHalaqahTime}
                  onChange={e => setNewHalaqahTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الحد الأقصى للطلاب (السعة):</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newHalaqahMaxStudents}
                  onChange={e => setNewHalaqahMaxStudents(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddHalaqahModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">إنشاء الحلقة</button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleAddUser} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm">إضافة مستخدم وتعيين الدور (RBAC)</h4>
              <button type="button" onClick={() => setIsAddUserModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="الاسم الثلاثي..."
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  required
                  placeholder="+9665..."
                  value={newUserPhone}
                  onChange={e => setNewUserPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            {/* الجنس وتاريخ الميلاد للمستخدم الجديد */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">الجنس:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserGender('MALE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      newUserGender === 'MALE'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>👨 ذكر (بنين)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserGender('FEMALE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      newUserGender === 'FEMALE'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>👩 أنثى (بنات)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  تاريخ الميلاد:
                  {newUserBirthDate && calculateAge(newUserBirthDate) !== null && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1.5">
                      (العمر: {calculateAge(newUserBirthDate)} سنة)
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={newUserBirthDate}
                  onChange={e => setNewUserBirthDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">نوع الدور (Role):</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  <option value="STUDENT">طالب (Student)</option>
                  <option value="TEACHER">معلم (Teacher)</option>
                  <option value="SUPERVISOR">مشرف (Supervisor)</option>
                  <option value="ADMIN">مدير النظام (Admin)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  placeholder="user@itqan.org"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">كلمة المرور الافتراضية:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled
                  value="123456"
                  className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold outline-none cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 shrink-0">كلمة المرور الأولية للحساب</span>
              </div>
            </div>

            {/* إذا كان الدور طالباً: إظهار اختيار الحلقة مباشرة */}
            {newUserRole === 'STUDENT' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  📖 الحلقة القرآنية المراد تسجيل الطالب بها مباشرة:
                </label>
                <select
                  value={newUserHalaqahId}
                  onChange={e => setNewUserHalaqahId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none"
                >
                  <option value="">-- بدون حلقة حالياً --</option>
                  {halaqat.map(h => {
                    const tch = users.find(u => u.id === h.teacherId);
                    return (
                      <option key={h.id} value={h.id}>
                        {h.name} (معلمها: {tch?.name || 'غير معين'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">الدولة:</label>
                <select
                  value={newUserCountryId}
                  onChange={e => setNewUserCountryId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                >
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">اللهجة:</label>
                <select
                  value={newUserDialectId}
                  onChange={e => setNewUserDialectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs outline-none"
                >
                  {countries.find(c => c.id === newUserCountryId)?.dialects.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {userActionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
                ⚠️ {userActionError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
              <button 
                type="submit" 
                disabled={isSubmittingUser}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {isSubmittingUser ? 'جاري الحفظ في PostgreSQL...' : 'إضافة المستخدم'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: إستعادة وإعادة تعيين كلمة المرور بواسطة مدير النظام
      ───────────────────────────────────────────────────────────── */}
      {resettingUser && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex min-h-full items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative my-auto">
            <button
              onClick={() => {
                setResettingUser(null);
                setResetResultMsg(null);
              }}
              className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  إعادة ضبط كلمة المرور
                </h3>
                <p className="text-xs text-slate-500">
                  للمستخدم: <strong className="text-slate-800 dark:text-slate-200">{resettingUser.name}</strong> ({resettingUser.phone || resettingUser.email})
                </p>
              </div>
            </div>

            {resetResultMsg && (
              <div className={`mb-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                resetResultMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                <span>{resetResultMsg.text}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsResettingUserPass(true);
                setResetResultMsg(null);
                try {
                  const res = await api.resetUserPassword(resettingUser.id, resetPasswordValue);
                  if (res.success) {
                    setResetResultMsg({
                      type: 'success',
                      text: `تمت إعادة تعيين كلمة المرور بنجاح إلى: (${res.newPassword || resetPasswordValue})`
                    });
                    setTimeout(() => {
                      setResettingUser(null);
                      setResetResultMsg(null);
                    }, 2500);
                  } else {
                    setResetResultMsg({ type: 'error', text: res.error || 'فشلت العملية' });
                  }
                } catch (err: any) {
                  setResetResultMsg({ type: 'error', text: err.message || 'فشلت عملية إعادة التعيين' });
                } finally {
                  setIsResettingUserPass(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  كلمة المرور الجديدة المحددة:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={resetPasswordValue}
                    onChange={e => setResetPasswordValue(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setResetPasswordValue('123456')}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-nowrap cursor-pointer"
                  >
                    الافتراضية (123456)
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  يمكنك تركها (123456) ككلمة مرور افتراضية أو كتابة كلمة مخصصة.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResettingUser(null);
                    setResetResultMsg(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isResettingUserPass}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isResettingUserPass ? 'جاري إعادة الضبط...' : 'تأكيد إعادة التعيين'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
