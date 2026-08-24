import { Country, User, Halaqah, HalaqahSession, StudentEnrollment } from '../types';
import { INITIAL_COUNTRIES, INITIAL_USERS, INITIAL_HALAQAT, INITIAL_SESSIONS } from '../data/mockData';

// API Base URL
const API_BASE = '/api/v1';

export const api = {
  // Countries
  async getCountries(): Promise<Country[]> {
    try {
      const res = await fetch(`${API_BASE}/countries`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('API fetch countries failed, falling back to cached/initial', e);
    }
    const local = localStorage.getItem('itqan_countries_v2');
    return local ? JSON.parse(local) : INITIAL_COUNTRIES;
  },

  async createCountry(country: Partial<Country>): Promise<Country> {
    const res = await fetch(`${API_BASE}/countries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(country),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create country' }));
      throw new Error(err.error || 'خطأ أثناء حفظ الدولة في قاعدة البيانات');
    }
    return await res.json();
  },

  async updateCountry(id: string, country: Partial<Country>): Promise<Country> {
    const res = await fetch(`${API_BASE}/countries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(country),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update country' }));
      throw new Error(err.error || 'خطأ أثناء تحديث بيانات الدولة');
    }
    return await res.json();
  },

  async deleteCountry(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/countries/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete country' }));
      throw new Error(err.error || 'فشل حذف الدولة');
    }
    return true;
  },

  // Dialects
  async createDialect(dialect: { countryId: string; name: string; code?: string; description?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/dialects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dialect),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create dialect' }));
      throw new Error(err.error || 'فشل حفظ اللهجة');
    }
    return await res.json();
  },

  async updateDialect(id: string, updates: { name?: string; code?: string; description?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/dialects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update dialect' }));
      throw new Error(err.error || 'فشل تعديل بيانات اللهجة');
    }
    return await res.json();
  },

  async deleteDialect(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/dialects/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete dialect' }));
      throw new Error(err.error || 'فشل حذف اللهجة');
    }
    return true;
  },

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('API fetch users failed, using cached data', e);
    }
    const local = localStorage.getItem('itqan_users_v2');
    return local ? JSON.parse(local) : INITIAL_USERS;
  },

  async createUser(user: Partial<User> & { password?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'فشل حفظ المستخدم في قاعدة البيانات' }));
      throw new Error(errData.error || 'فشل حفظ المستخدم في PostgreSQL');
    }
    return await res.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'فشل تحديث المستخدم' }));
      throw new Error(errData.error || 'فشل تحديث المستخدم في PostgreSQL');
    }
    return await res.json();
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'فشل حذف المستخدم' }));
      throw new Error(errData.error || 'فشل حذف المستخدم من PostgreSQL');
    }
    return true;
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPassword, newPassword }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'فشل الاتصال لتغيير كلمة المرور' };
    }
  },

  async resetUserPassword(userId: string, newPassword?: string): Promise<{ success: boolean; message?: string; newPassword?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPassword || '123456' }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'فشل إعادة ضبط كلمة المرور' };
    }
  },

  // Halaqat
  async getHalaqat(): Promise<Halaqah[]> {
    try {
      const res = await fetch(`${API_BASE}/halaqat`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('API fetch halaqat failed', e);
    }
    const local = localStorage.getItem('itqan_halaqat_v2');
    return local ? JSON.parse(local) : INITIAL_HALAQAT;
  },

  async createHalaqah(hlq: Partial<Halaqah>): Promise<Halaqah> {
    const res = await fetch(`${API_BASE}/halaqat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hlq),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'فشل حفظ الحلقة' }));
      throw new Error(errData.error || 'فشل حفظ الحلقة في PostgreSQL');
    }
    return await res.json();
  },

  async updateHalaqah(id: string, updates: Partial<Halaqah>): Promise<Halaqah> {
    const res = await fetch(`${API_BASE}/halaqat/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'فشل تحديث بيانات الحلقة' }));
      throw new Error(errData.error || 'فشل تحديث الحلقة في PostgreSQL');
    }
    return await res.json();
  },

  async deleteHalaqah(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/halaqat/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'فشل حذف الحلقة' }));
      throw new Error(errData.error || 'فشل حذف الحلقة من PostgreSQL');
    }
    return true;
  },

  // Enrollments (ربط الطلاب بالحلقات)
  async getEnrollments(): Promise<StudentEnrollment[]> {
    try {
      const res = await fetch(`${API_BASE}/enrollments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('API fetch enrollments failed', e);
    }
    const local = localStorage.getItem('itqan_enrollments_v2');
    return local ? JSON.parse(local) : [];
  },

  async createEnrollment(enrollment: { circleId: string; studentId: string; status?: string }): Promise<StudentEnrollment> {
    const res = await fetch(`${API_BASE}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrollment),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'فشل ربط الطالب بالحلقة' }));
      throw new Error(errData.error || 'فشل تسجيل الطالب في الحلقة');
    }
    return await res.json();
  },

  async deleteEnrollment(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/enrollments/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('فشل إلغاء ربط الطالب بالحلقة');
    }
    return true;
  },

  // Sessions
  async getSessions(): Promise<HalaqahSession[]> {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('API fetch sessions failed', e);
    }
    const local = localStorage.getItem('itqan_sessions_v2');
    return local ? JSON.parse(local) : INITIAL_SESSIONS;
  },

  async saveSession(session: HalaqahSession): Promise<HalaqahSession> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'فشل حفظ الجلسة' }));
      throw new Error(errData.error || 'فشل حفظ الجلسة في PostgreSQL');
    }
    return await res.json();
  },

  // Auth / Login
  async login(identifier: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: password || '123456' }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: 'تعذر الاتصال بخادم تسجيل الدخول' };
    }
  },

  // Health / Diagnostics
  async getHealth() {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  }
};
