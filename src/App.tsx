import React, { useState, useEffect } from 'react';
import { 
  getStoredCountries, 
  getStoredEnrollments, 
  getStoredHalaqat, 
  getStoredSessions, 
  getStoredUsers, 
  resetAllData, 
  setStoredCountries, 
  setStoredEnrollments, 
  setStoredHalaqat, 
  setStoredSessions, 
  setStoredUsers 
} from './utils/storage';
import { Country, Halaqah, HalaqahSession, StudentEnrollment, User, UserRole } from './types';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { TeacherSessionRecorder } from './components/TeacherSessionRecorder';
import { ReportsView } from './components/ReportsView';
import { AdminManagement } from './components/AdminManagement';
import { DatabaseArchitecture } from './components/DatabaseArchitecture';
import { SwaggerApiDocs } from './components/SwaggerApiDocs';
import { api } from './utils/api';

const AUTH_USER_KEY = 'itqan_auth_user_id_v3';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch {
      // fallback
    }
    return false;
  });

  // Persistent Data States
  const [users, setUsersState] = useState<User[]>(getStoredUsers);
  const [countries, setCountriesState] = useState<Country[]>(getStoredCountries);
  const [halaqat, setHalaqatState] = useState<Halaqah[]>(getStoredHalaqat);
  const [enrollments, setEnrollmentsState] = useState<StudentEnrollment[]>(getStoredEnrollments);
  const [sessions, setSessionsState] = useState<HalaqahSession[]>(getStoredSessions);

  // Authentication State: null = not logged in (shows LoginScreen)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_USER_KEY);
    } catch {
      return null;
    }
  });

  const currentUser = users.find(u => u.id === currentUserId) || null;

  // Active Tab
  const [currentTab, setCurrentTab] = useState<'TEACHER_RECORDER' | 'REPORTS' | 'ADMIN' | 'ARCHITECTURE' | 'DOCS'>('TEACHER_RECORDER');

  // RBAC Permission Map for Tabs
  const roleAllowedTabs: Record<UserRole, ('TEACHER_RECORDER' | 'REPORTS' | 'ADMIN' | 'ARCHITECTURE' | 'DOCS')[]> = {
    ADMIN: ['ADMIN', 'TEACHER_RECORDER', 'REPORTS', 'ARCHITECTURE', 'DOCS'],
    SUPERVISOR: ['REPORTS', 'TEACHER_RECORDER'],
    TEACHER: ['TEACHER_RECORDER', 'REPORTS'],
    STUDENT: ['REPORTS']
  };

  // Initial Sync from PostgreSQL API on Load
  useEffect(() => {
    async function loadDataFromApi() {
      try {
        const [apiCountries, apiUsers, apiHalaqat, apiSessions, apiEnrollments] = await Promise.all([
          api.getCountries(),
          api.getUsers(),
          api.getHalaqat(),
          api.getSessions(),
          api.getEnrollments()
        ]);
        if (Array.isArray(apiCountries)) { setCountriesState(apiCountries); setStoredCountries(apiCountries); }
        if (Array.isArray(apiUsers)) { setUsersState(apiUsers); setStoredUsers(apiUsers); }
        if (Array.isArray(apiHalaqat)) { setHalaqatState(apiHalaqat); setStoredHalaqat(apiHalaqat); }
        if (Array.isArray(apiSessions)) { setSessionsState(apiSessions); setStoredSessions(apiSessions); }
        if (Array.isArray(apiEnrollments)) { setEnrollmentsState(apiEnrollments); setStoredEnrollments(apiEnrollments); }
      } catch (e) {
        console.warn('Syncing with PostgreSQL API...', e);
      }
    }
    loadDataFromApi();
  }, []);

  // Sync dark mode class with html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Ensure currentTab is allowed for current user's role
  useEffect(() => {
    if (currentUser) {
      const allowed = roleAllowedTabs[currentUser.role] || ['REPORTS'];
      if (!allowed.includes(currentTab)) {
        setCurrentTab(allowed[0]);
      }
    }
  }, [currentUser, currentTab]);

  // Setters with storage sync
  const setUsers = (newUsers: User[]) => {
    setUsersState(newUsers);
    setStoredUsers(newUsers);
  };

  const setCountries = (newCountries: Country[]) => {
    setCountriesState(newCountries);
    setStoredCountries(newCountries);
  };

  const setHalaqat = (newHalaqat: Halaqah[]) => {
    setHalaqatState(newHalaqat);
    setStoredHalaqat(newHalaqat);
  };

  const setEnrollments = (newEnrollments: StudentEnrollment[]) => {
    setEnrollmentsState(newEnrollments);
    setStoredEnrollments(newEnrollments);
  };

  const handleSaveSession = async (newSession: HalaqahSession) => {
    const existingIndex = sessions.findIndex(s => s.id === newSession.id || (s.circleId === newSession.circleId && s.date === newSession.date));
    let updatedSessions: HalaqahSession[];
    if (existingIndex >= 0) {
      updatedSessions = [...sessions];
      updatedSessions[existingIndex] = newSession;
    } else {
      updatedSessions = [newSession, ...sessions];
    }
    setSessionsState(updatedSessions);
    setStoredSessions(updatedSessions);

    // Save directly to PostgreSQL via API
    await api.saveSession(newSession);
  };

  const handleResetData = () => {
    if (window.confirm('هل تريد إعادة تعيين جميع البيانات التجريبية إلى حالتها الأصلية؟')) {
      resetAllData();
      localStorage.removeItem(AUTH_USER_KEY);
      window.location.reload();
    }
  };

  // Login handler
  const handleLoginSuccess = (user: User) => {
    // Add user to state if new
    if (!users.find(u => u.id === user.id)) {
      setUsers([...users, user]);
    }
    setCurrentUserId(user.id);
    try {
      localStorage.setItem(AUTH_USER_KEY, user.id);
    } catch {
      // ignore
    }

    // Route to default tab based on role
    if (user.role === 'ADMIN') {
      setCurrentTab('ADMIN');
    } else if (user.role === 'TEACHER') {
      setCurrentTab('TEACHER_RECORDER');
    } else if (user.role === 'SUPERVISOR') {
      setCurrentTab('REPORTS');
    } else if (user.role === 'STUDENT') {
      setCurrentTab('REPORTS');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUserId(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // ignore
    }
  };

  // 1. If not logged in -> Display LoginScreen exclusively
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        users={users}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  // 2. If logged in -> Display Role-Restricted Dashboard
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Navbar with role-tailored tabs and logout button */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onResetData={handleResetData}
      />

      {/* Role Banner / Context Bar */}
      <div className="bg-emerald-800 text-white py-2 px-4 text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 px-2 py-0.5 rounded font-bold">
              {currentUser.role === 'ADMIN' && '🛡️ مدير النظام (كافة الصلاحيات)'}
              {currentUser.role === 'SUPERVISOR' && '👳‍♂️ مشرف تربوي (متابعة وتقارير الحلقات)'}
              {currentUser.role === 'TEACHER' && '👨‍🏫 معلم حلقة (رصد درجات طلاب حلقاتي)'}
              {currentUser.role === 'STUDENT' && '👦 الطالب (سجل الحفظ والمصحف والتسميع)'}
            </span>
            <span>مرحباً بك: <strong className="underline">{currentUser.name}</strong> ({currentUser.phone || currentUser.email})</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-emerald-100">
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={handleResetData}
                className="hover:underline text-emerald-200 hover:text-white"
              >
                إعادة ضبط البيانات ↺
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-2.5 py-0.5 bg-emerald-700 hover:bg-emerald-600 rounded text-white font-bold transition"
            >
              تسجيل الخروج 🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area (Protected by RBAC) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Tab 1: Teacher Session Recorder (Accessible to TEACHER, SUPERVISOR, ADMIN) */}
        {currentTab === 'TEACHER_RECORDER' && (currentUser.role === 'TEACHER' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN') && (
          <TeacherSessionRecorder
            currentTeacher={currentUser.role === 'TEACHER' ? currentUser : users.find(u => u.role === 'TEACHER') || currentUser}
            halaqat={halaqat}
            allStudents={users.filter(u => u.role === 'STUDENT')}
            enrollments={enrollments}
            sessions={sessions}
            onSaveSession={handleSaveSession}
          />
        )}

        {/* Tab 2: Reports (Accessible to all roles, but auto-scoped inside component) */}
        {currentTab === 'REPORTS' && (
          <ReportsView
            currentUser={currentUser}
            users={users}
            halaqat={halaqat}
            sessions={sessions}
            enrollments={enrollments}
          />
        )}

        {/* Tab 3: Admin Management (ADMIN ONLY) */}
        {currentTab === 'ADMIN' && currentUser.role === 'ADMIN' && (
          <AdminManagement
            countries={countries}
            setCountries={setCountries}
            halaqat={halaqat}
            setHalaqat={setHalaqat}
            users={users}
            setUsers={setUsers}
            enrollments={enrollments}
            setEnrollments={setEnrollments}
          />
        )}

        {/* Tab 4: Database Architecture (ADMIN ONLY) */}
        {currentTab === 'ARCHITECTURE' && currentUser.role === 'ADMIN' && (
          <DatabaseArchitecture />
        )}

        {/* Tab 5: Swagger API Docs (ADMIN ONLY) */}
        {currentTab === 'DOCS' && currentUser.role === 'ADMIN' && (
          <SwaggerApiDocs />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} إتقان | نظام متكامل لإدارة وتوثيق حلقات القرآن الكريم</p>
          <p className="font-mono text-[11px]">DigitalOcean PostgreSQL (itqan schema) • صلاحيات وأدوار RBAC محكمة</p>
        </div>
      </footer>
    </div>
  );
}
