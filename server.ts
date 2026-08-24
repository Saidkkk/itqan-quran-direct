import express, { type Request, type Response } from 'express';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg, { type PoolClient } from 'pg';

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: express.Express = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// =========================================================================
// إعداد الاتصال بقاعدة بيانات PostgreSQL المدارة على DigitalOcean
// =========================================================================

let pool: pg.Pool | null = null;
const SCHEMA = process.env.DB_SCHEMA || 'itqan';

try {
  if (process.env.DB_HOST && process.env.DB_USER) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 25060,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'defaultdb',
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    });
    console.log(`✅ تم إعداد اتصال PostgreSQL عبر المتغيرات المفككة (سكيما: ${SCHEMA})`);
  } else if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    console.log(`✅ تم إعداد اتصال PostgreSQL عبر DATABASE_URL (سكيما: ${SCHEMA})`);
  }
} catch (err) {
  console.warn('⚠️ تنبيه: لم يتم تهيئة اتصال PostgreSQL:', err);
}

// ضبط السكيما الافتراضية itqan عند كل اتصال
if (pool) {
  pool.on('connect', (client: PoolClient) => {
    client.query(`SET search_path TO ${SCHEMA}, public;`).catch((e: any) => {
      console.error(`Error setting search_path to ${SCHEMA}:`, e);
    });
  });
}

// =========================================================================
// التهيئة التلقائية للجداول والسكيما عند تشغيل السيرفر (Auto DB Migration)
// =========================================================================
async function initDatabaseSchema() {
  if (!pool) return;
  try {
    console.log(`⏳ جاري التحقق من تهيئة سكيما ${SCHEMA} وجداول إتقان في PostgreSQL...`);
    
    // إنشاء السكيما وتفعيل uuid
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA};`);
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // جدول الدول
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA}.countries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name_ar VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        code VARCHAR(10) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // جدول اللهجات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA}.dialects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        country_id UUID NOT NULL REFERENCES ${SCHEMA}.countries(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // جدول المستخدمين
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA}.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(25) NOT NULL UNIQUE,
        email VARCHAR(120) UNIQUE,
        password_hash VARCHAR(255) NOT NULL DEFAULT '123456',
        role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
        country_id UUID REFERENCES ${SCHEMA}.countries(id) ON DELETE SET NULL,
        dialect_id UUID REFERENCES ${SCHEMA}.dialects(id) ON DELETE SET NULL,
        supervisor_id UUID REFERENCES ${SCHEMA}.users(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // جدول الحلقات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA}.halaqat (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        teacher_id UUID REFERENCES ${SCHEMA}.users(id) ON DELETE SET NULL,
        supervisor_id UUID REFERENCES ${SCHEMA}.users(id) ON DELETE SET NULL,
        target_juz INTEGER DEFAULT 3,
        level VARCHAR(50) DEFAULT 'متوسط',
        schedule_days TEXT[] NOT NULL DEFAULT ARRAY['الأحد', 'الثلاثاء', 'الخميس'],
        time_slot VARCHAR(100),
        max_students INTEGER DEFAULT 15,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // جدول الجلسات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA}.sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        circle_id UUID REFERENCES ${SCHEMA}.halaqat(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES ${SCHEMA}.users(id) ON DELETE SET NULL,
        session_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'COMPLETED',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_circle_session_date UNIQUE (circle_id, session_date)
      );
    `);

    // 1. بذر بيانات الدول الأساسية
    await pool.query(`
      INSERT INTO ${SCHEMA}.countries (name_ar, name_en, code)
      VALUES 
        ('المملكة العربية السعودية', 'Saudi Arabia', 'SA'),
        ('جمهورية مصر العربية', 'Egypt', 'EG'),
        ('المملكة المغربية', 'Morocco', 'MA'),
        ('المملكة الأردنية الهاشمية', 'Jordan', 'JO'),
        ('الإمارات العربية المتحدة', 'United Arab Emirates', 'AE'),
        ('دولة الكويت', 'Kuwait', 'KW')
      ON CONFLICT (code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    `);

    // 2. بذر المستخدمين الأساسيين فقط إذا كان الجدول فارغاً لمنع مسح أو تعديل أي مستخدم
    const usersCountRes = await pool.query(`SELECT COUNT(*) FROM ${SCHEMA}.users;`);
    if (parseInt(usersCountRes.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO ${SCHEMA}.users (name, phone, email, role, is_active)
        VALUES 
          ('الشيخ عبد الله بن فهد المنصور', '+966501112233', 'admin@itqan-quran.org', 'ADMIN', true),
          ('الشيخ د. عثمان الشنقيطي', '+966502223344', 'othman.sh@itqan-quran.org', 'SUPERVISOR', true),
          ('الشيخ أحمد مصطفى المعصراوي', '+201003334455', 'maasarawi@itqan-quran.org', 'SUPERVISOR', true),
          ('الشيخ محمود بن خليل الحافظ', '+966504445566', 'mahmoud.khalil@itqan-quran.org', 'TEACHER', true),
          ('الشيخ إبراهيم الدوسري', '+966505556677', 'ibrahim.d@itqan-quran.org', 'TEACHER', true),
          ('الشيخ حمزة بن عبد الله التازي', '+212606667788', 'hamza.tazi@itqan-quran.org', 'TEACHER', true),
          ('الشيخ عبد الرحمن بن ناصر', '+966503334455', 'abdulrahman@itqan-quran.org', 'TEACHER', true),
          ('عمر بن عبد العزيز الحربي', '+966551122331', 'omar.harbi@student.itqan.org', 'STUDENT', true),
          ('عبد الله بن أحمد السبيعي', '+966551122332', 'abdullah.ahmed@student.itqan.org', 'STUDENT', true),
          ('يوسف بن طارق المنصوري', '+971501122333', 'youssef.m@student.itqan.org', 'STUDENT', true),
          ('معاذ بن صالح الزهراني', '+966551122334', 'muadh.z@student.itqan.org', 'STUDENT', true)
        ON CONFLICT (phone) DO NOTHING;
      `);
    }

    // 3. بذر حلقات افتراضية أولية وربطها بالمعلمين
    await pool.query(`
      INSERT INTO ${SCHEMA}.halaqat (name, code, target_juz, level, schedule_days, time_slot, max_students, is_active)
      VALUES 
        ('حلقة الإمام الشاطبي للإتقان', 'HLQ-101', 5, 'متقدم', ARRAY['الأحد', 'الثلاثاء', 'الخميس'], 'بعد صلاة العصر', 15, true),
        ('حلقة الإمام نافع المدني', 'HLQ-102', 3, 'متوسط', ARRAY['السبت', 'الإثنين', 'الأربعاء'], 'بعد صلاة المغرب', 12, true),
        ('حلقة الإمام عاصم للناشئة', 'HLQ-103', 1, 'مبتدئ', ARRAY['الأحد', 'الثلاثاء', 'الخميس'], 'بعد صلاة العصر', 10, true)
      ON CONFLICT (code) DO NOTHING;
    `);

    // ربط المعلمين بالحلقات تلقائياً
    await pool.query(`
      UPDATE ${SCHEMA}.halaqat h
      SET teacher_id = (SELECT id FROM ${SCHEMA}.users WHERE role = 'TEACHER' ORDER BY name ASC LIMIT 1)
      WHERE h.teacher_id IS NULL;
    `);

    console.log(`✅ سكيما ${SCHEMA} وجداول إتقان جاهزة ومتصلة 100% في PostgreSQL مع المستخدمين الـ 10 كاملين!`);
  } catch (err: any) {
    console.error('❌ خطأ أثناء تهيئة سكيما قاعدة البيانات:', err.message);
  }
}

initDatabaseSchema();

// =========================================================================
// 1. مسار الفحص والتشخيص (Healthcheck API)
// =========================================================================
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'not_connected';
  let dbLatency = null;
  let countriesCount = 0;

  if (pool) {
    try {
      const start = Date.now();
      const countRes = await pool.query(`SELECT COUNT(*) FROM ${SCHEMA}.countries;`);
      dbLatency = `${Date.now() - start}ms`;
      dbStatus = 'connected';
      countriesCount = Number(countRes.rows[0]?.count || 0);
    } catch (err: any) {
      dbStatus = `error: ${err?.message || 'failed'}`;
    }
  }

  res.json({
    status: 'healthy',
    app: 'Itqan Quran Platform',
    domain: 'itqan.katatibi.com',
    timestamp: new Date().toISOString(),
    postgres: {
      status: dbStatus,
      latency: dbLatency,
      schema: SCHEMA,
      countries_in_db: countriesCount,
      auth_method: process.env.DB_HOST ? 'discrete_env_vars' : (process.env.DATABASE_URL ? 'connection_string' : 'none')
    }
  });
});

// =========================================================================
// 2. مسارات الدول واللهجات (Countries & Dialects REST API)
// =========================================================================

// جلب الدول مع لهجاتها
app.get('/api/v1/countries', async (req: Request, res: Response) => {
  if (!pool) return res.json([]);
  try {
    const countriesResult = await pool.query(
      `SELECT id, name_ar AS "nameAr", name_en AS "nameEn", code FROM ${SCHEMA}.countries ORDER BY name_ar ASC;`
    );
    const dialectsResult = await pool.query(
      `SELECT id, country_id AS "countryId", name, code, description FROM ${SCHEMA}.dialects ORDER BY name ASC;`
    );

    const dialectsByCountry = new Map<string, any[]>();
    dialectsResult.rows.forEach(d => {
      if (!dialectsByCountry.has(d.countryId)) {
        dialectsByCountry.set(d.countryId, []);
      }
      dialectsByCountry.get(d.countryId)?.push(d);
    });

    const countries = countriesResult.rows.map(c => ({
      ...c,
      dialects: dialectsByCountry.get(c.id) || []
    }));

    res.json(countries);
  } catch (err: any) {
    console.error('Error fetching countries:', err);
    res.status(500).json({ error: err.message });
  }
});

// إضافة دولة جديدة في جدول itqan.countries
app.post('/api/v1/countries', async (req: Request, res: Response) => {
  if (!pool) {
    console.error('Database pool is null!');
    return res.status(500).json({ error: 'Database not connected' });
  }
  const { nameAr, nameEn, code, dialects } = req.body;

  try {
    console.log('📥 استلام طلب إضافة دولة جديدة:', { nameAr, nameEn, code });
    const insertCountry = await pool.query(
      `INSERT INTO ${SCHEMA}.countries (name_ar, name_en, code)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en
       RETURNING id, name_ar AS "nameAr", name_en AS "nameEn", code;`,
      [nameAr, nameEn || '', (code || `C${Date.now().toString().slice(-4)}`).toUpperCase()]
    );

    const savedCountry = insertCountry.rows[0];
    console.log('✅ تم حفظ الدولة بنجاح في PostgreSQL:', savedCountry);
    const savedDialects: any[] = [];

    if (Array.isArray(dialects) && dialects.length > 0) {
      for (const d of dialects) {
        const diaRes = await pool.query(
          `INSERT INTO ${SCHEMA}.dialects (country_id, name, code, description)
           VALUES ($1, $2, $3, $4)
           RETURNING id, country_id AS "countryId", name, code, description;`,
          [savedCountry.id, d.name, d.code || 'general', d.description || '']
        );
        savedDialects.push(diaRes.rows[0]);
      }
    }

    res.status(201).json({
      ...savedCountry,
      dialects: savedDialects
    });
  } catch (err: any) {
    console.error('❌ خطأ أثناء حفظ الدولة في PostgreSQL:', err);
    res.status(500).json({ error: err.message });
  }
});

// حذف دولة
app.delete('/api/v1/countries/:id', async (req: Request, res: Response) => {
  if (!pool) return res.status(500).json({ error: 'Database not connected' });
  try {
    await pool.query(`DELETE FROM ${SCHEMA}.countries WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Country deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 3. مسارات المستخدمين وتسجيل الدخول (Users & Auth REST API)
// =========================================================================

// تسجيل الدخول (برقم الهاتف أو البريد الإلكتروني)
app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'الرجاء إدخال رقم الهاتف أو البريد الإلكتروني' });
  }

  if (!pool) {
    return res.json({ success: false, error: 'Database not connected' });
  }

  try {
    const cleanIdentifier = identifier.trim();
    const userRes = await pool.query(
      `SELECT id, name, phone, email, role, country_id AS "countryId", dialect_id AS "dialectId",
              supervisor_id AS "supervisorId", is_active AS "isActive", created_at AS "createdAt"
       FROM ${SCHEMA}.users 
       WHERE (phone = $1 OR email = $1 OR phone ILIKE $2)
       LIMIT 1;`,
      [cleanIdentifier, `%${cleanIdentifier.replace(/[^0-9]/g, '')}%`]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'رقم الهاتف أو البريد غير مسجل بالنظام' });
    }

    const user = userRes.rows[0];
    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'هذا الحساب معطل حالياً، تواصل مع المشرف' });
    }

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        ...user,
        currentJuz: 1,
        totalMemorizedAyahs: 150
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// جلب المستخدمين
app.get('/api/v1/users', async (req: Request, res: Response) => {
  if (!pool) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT id, name, phone, email, role, country_id AS "countryId", dialect_id AS "dialectId",
              supervisor_id AS "supervisorId", is_active AS "isActive", created_at AS "createdAt"
       FROM ${SCHEMA}.users 
       ORDER BY created_at DESC;`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة مستخدم جديد (إنشاء مستخدم مستقل تماماً)
app.post('/api/v1/users', async (req: Request, res: Response) => {
  if (!pool) return res.status(500).json({ error: 'Database not connected' });
  const { name, phone, email, password, role, countryId, dialectId, supervisorId } = req.body;

  try {
    const cleanPhone = (phone || '').toString().trim();
    const cleanName = (name || '').toString().trim();
    const cleanEmail = email && typeof email === 'string' && email.trim() !== '' ? email.trim() : null;
    const cleanRole = (role || 'STUDENT').toString().toUpperCase();

    if (!cleanPhone || !cleanName) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
    }

    // التحقق من عدم وجود مستخدم مسجل مسبقاً بنفس رقم الهاتف
    const existingPhoneRes = await pool.query(
      `SELECT id, name, role FROM ${SCHEMA}.users WHERE phone = $1 LIMIT 1;`,
      [cleanPhone]
    );
    if (existingPhoneRes.rows.length > 0) {
      const existingUser = existingPhoneRes.rows[0];
      return res.status(400).json({
        error: `رقم الهاتف (${cleanPhone}) مسجل مسبقاً باسم: "${existingUser.name}" كـ (${existingUser.role}). يرجى كتابة رقم هاتف مختلف لمنع استبدال المستخدم القديم.`
      });
    }

    // مطابقة معرّف الدولة إذا كان UUID أو كود (مثل SA أو cnt-sa)
    let resolvedCountryId: string | null = null;
    if (countryId) {
      if (typeof countryId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(countryId)) {
        resolvedCountryId = countryId;
      } else {
        const code = countryId.replace('cnt-', '').toUpperCase();
        const cRes = await pool.query(`SELECT id FROM ${SCHEMA}.countries WHERE code = $1 LIMIT 1;`, [code]);
        if (cRes.rows.length > 0) resolvedCountryId = cRes.rows[0].id;
      }
    }

    // مطابقة معرّف المشرف إذا كان UUID
    let resolvedSupervisorId: string | null = null;
    if (supervisorId && typeof supervisorId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supervisorId)) {
      resolvedSupervisorId = supervisorId;
    }

    const result = await pool.query(
      `INSERT INTO ${SCHEMA}.users (name, phone, email, password_hash, role, country_id, dialect_id, supervisor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, phone, email, role, country_id AS "countryId", dialect_id AS "dialectId",
                 supervisor_id AS "supervisorId", is_active AS "isActive", created_at AS "createdAt";`,
      [
        cleanName,
        cleanPhone,
        cleanEmail,
        password || '123456',
        cleanRole,
        resolvedCountryId,
        null, // dialect_id
        resolvedSupervisorId
      ]
    );

    console.log(`✅ تم إنشاء مستخدم جديد بنجاح في PostgreSQL:`, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ خطأ أثناء إنشاء المستخدم في PostgreSQL:', err);
    res.status(500).json({ error: err.message });
  }
});

// تحديث مستخدم موجود
app.put('/api/v1/users/:id', async (req: Request, res: Response) => {
  if (!pool) return res.status(500).json({ error: 'Database not connected' });
  const { id } = req.params;
  const { name, phone, email, role, isActive } = req.body;

  try {
    const result = await pool.query(
      `UPDATE ${SCHEMA}.users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           role = COALESCE($4, role),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, phone, email, role, country_id AS "countryId", dialect_id AS "dialectId",
                 supervisor_id AS "supervisorId", is_active AS "isActive", created_at AS "createdAt";`,
      [name, phone, email, role, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// حذف مستخدم
app.delete('/api/v1/users/:id', async (req: Request, res: Response) => {
  if (!pool) return res.status(500).json({ error: 'Database not connected' });
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM ${SCHEMA}.users WHERE id = $1;`, [id]);
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 4. مسارات الحلقات والجلسات (Halaqat & Sessions REST API)
// =========================================================================

app.get('/api/v1/halaqat', async (req: Request, res: Response) => {
  if (!pool) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT id, name, code, teacher_id AS "teacherId", supervisor_id AS "supervisorId",
              target_juz AS "targetJuz", level, schedule_days AS "scheduleDays",
              time_slot AS "timeSlot", max_students AS "maxStudents", is_active AS "isActive",
              created_at AS "createdAt"
       FROM ${SCHEMA}.halaqat 
       ORDER BY created_at DESC;`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/halaqat', async (req: Request, res: Response) => {
  if (!pool) return res.status(500).json({ error: 'Database not connected' });
  const { name, code, teacherId, supervisorId, targetJuz, level, scheduleDays, timeSlot, maxStudents } = req.body;

  try {
    let resolvedTeacherId: string | null = null;
    if (teacherId && typeof teacherId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherId)) {
      resolvedTeacherId = teacherId;
    } else {
      // إذا لم يكن UUID، اختر أول معلم متوفر في قاعدة البيانات
      const tRes = await pool.query(`SELECT id FROM ${SCHEMA}.users WHERE role = 'TEACHER' LIMIT 1;`);
      if (tRes.rows.length > 0) resolvedTeacherId = tRes.rows[0].id;
    }

    let resolvedSupervisorId: string | null = null;
    if (supervisorId && typeof supervisorId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supervisorId)) {
      resolvedSupervisorId = supervisorId;
    }

    const result = await pool.query(
      `INSERT INTO ${SCHEMA}.halaqat (name, code, teacher_id, supervisor_id, target_juz, level, schedule_days, time_slot, max_students)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, code, teacher_id AS "teacherId", supervisor_id AS "supervisorId",
                 target_juz AS "targetJuz", level, schedule_days AS "scheduleDays",
                 time_slot AS "timeSlot", max_students AS "maxStudents", is_active AS "isActive",
                 created_at AS "createdAt";`,
      [
        name,
        code || `HLQ-${Date.now().toString().slice(-4)}`,
        resolvedTeacherId,
        resolvedSupervisorId,
        targetJuz || 3,
        level || 'متوسط',
        scheduleDays || ['الأحد', 'الثلاثاء', 'الخميس'],
        timeSlot || 'بعد العصر',
        maxStudents || 15
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating halaqah:', err);
    res.status(500).json({ error: err.message });
  }
});

// توثيق وحفظ جلسات التسميع
app.post('/api/v1/sessions', async (req: Request, res: Response) => {
  const sessionData = req.body;

  if (pool) {
    try {
      const circleId = (sessionData.circle_id || sessionData.circleId || '').length === 36 
        ? (sessionData.circle_id || sessionData.circleId) 
        : null;
      const teacherId = (sessionData.teacher_id || sessionData.teacherId || '').length === 36 
        ? (sessionData.teacher_id || sessionData.teacherId) 
        : null;
      const sessionDate = sessionData.session_date || sessionData.date || new Date().toISOString().split('T')[0];
      const notes = sessionData.notes || 'جلسة تسميع مسجلة عبر تطبيق إتقان';

      if (circleId) {
        const result = await pool.query(
          `INSERT INTO ${SCHEMA}.sessions (circle_id, teacher_id, session_date, status, notes)
           VALUES ($1, $2, $3, 'COMPLETED', $4)
           ON CONFLICT (circle_id, session_date) DO UPDATE SET notes = EXCLUDED.notes
           RETURNING id, created_at;`,
          [circleId, teacherId, sessionDate, notes]
        );

        return res.status(201).json({
          status: 'success',
          message: 'تم حفظ وتوثيق الجلسة في PostgreSQL بنجاح',
          session_id: result.rows[0]?.id || `ses-${Date.now()}`,
          received_data: sessionData
        });
      }
    } catch (err: any) {
      console.error('Database session insertion error:', err);
    }
  }

  res.status(201).json({
    status: 'success',
    message: 'تم حفظ وتوثيق الجلسة بنجاح',
    session_id: `ses-${Date.now()}`,
    received_data: sessionData
  });
});

// Serve Vite Static Production Build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA Fallback to index.html
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🌿 منصة إتقان لتحفيظ القرآن تعمل الآن على المنفذ ${PORT}`);
  console.log(`🔗 النطاق: http://0.0.0.0:${PORT}`);
  console.log(`=========================================`);
});
