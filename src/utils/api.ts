import { Country, User, Halaqah, HalaqahSession } from '../types';
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

  async deleteCountry(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/countries/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('فشل حذف الدولة');
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
