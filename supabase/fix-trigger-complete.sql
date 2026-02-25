-- ═══════════════════════════════════════════════════════════
-- الخطوة 1: تشخيص الوضع الحالي
-- ═══════════════════════════════════════════════════════════
-- شغّل هذا أولاً لترى ما هو موجود:
SELECT trigger_name, event_manipulation, event_object_schema, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- ═══════════════════════════════════════════════════════════
-- الخطوة 2: إزالة كل شيء قديم
-- ═══════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ═══════════════════════════════════════════════════════════
-- الخطوة 3: تأكد من وجود عمود phone وunique على user_id
-- ═══════════════════════════════════════════════════════════
ALTER TABLE publicsv.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- تأكد أن approve لها unique على user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'approve_user_id_key' AND conrelid = 'publicsv.approve'::regclass
  ) THEN
    ALTER TABLE publicsv.approve ADD CONSTRAINT approve_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- الخطوة 4: إنشاء الـ trigger function الصحيح
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _auto_approve  boolean := false;
  _final_status  text    := 'pending';
  _role          text    := 'user';
  _name          text;
  _avatar        text;
BEGIN

  -- استخراج الاسم
  _name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(COALESCE(NEW.email, ''), '@', 1),
    'مستخدم'
  );

  -- استخراج الصورة
  _avatar := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), '')
  );

  -- هل هو admin خاص؟
  IF NEW.email = 'admin@test.com' THEN
    _role := 'admin';
    _final_status := 'approved';
  ELSE
    -- قراءة إعداد الموافقة التلقائية
    BEGIN
      SELECT
        CASE
          WHEN value = 'true'::jsonb  THEN true
          WHEN value = '"true"'::jsonb THEN true
          WHEN value = '1'::jsonb     THEN true
          ELSE false
        END
      INTO _auto_approve
      FROM publicsv.settings
      WHERE key = 'auto_approve'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      _auto_approve := false;
    END;

    IF _auto_approve THEN
      _final_status := 'approved';
    END IF;
  END IF;

  -- إدراج في جدول users (تجاهل إذا موجود)
  INSERT INTO publicsv.users (id, email, name, avatar_url, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    _name,
    _avatar,
    _role,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- إدراج في جدول approve (تجاهل إذا موجود)
  INSERT INTO publicsv.approve (user_id, status, requested_at, approved_at, approved_by)
  VALUES (
    NEW.id,
    _final_status,
    NOW(),
    CASE WHEN _final_status = 'approved' THEN NOW() ELSE NULL END,
    CASE WHEN _role = 'admin' THEN NEW.id ELSE NULL END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- سجّل الخطأ لكن لا توقف عملية التسجيل
  RAISE LOG 'handle_new_user error for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

-- منح الصلاحيات اللازمة للدالة
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- ═══════════════════════════════════════════════════════════
-- الخطوة 5: إنشاء الـ trigger
-- ═══════════════════════════════════════════════════════════
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- الخطوة 6: إصلاح RLS على approve
-- بحيث تسمح بالإدراج من قِبل الـ trigger (postgres role)
-- ═══════════════════════════════════════════════════════════

-- تعطيل RLS مؤقتاً ثم إعادة تفعيله بسياسة صحيحة
ALTER TABLE publicsv.approve DISABLE ROW LEVEL SECURITY;
ALTER TABLE publicsv.approve ENABLE ROW LEVEL SECURITY;

-- احذف السياسات القديمة
DROP POLICY IF EXISTS "approve insert own request" ON publicsv.approve;
DROP POLICY IF EXISTS "approve select own" ON publicsv.approve;
DROP POLICY IF EXISTS "approve admin all" ON publicsv.approve;

-- سياسة القراءة: المستخدم يرى سجله فقط، الأدمن يرى الكل
CREATE POLICY "approve select"
ON publicsv.approve FOR SELECT
USING (
  auth.uid() = user_id
  OR publicsv.is_admin()
);

-- سياسة الإدراج: المستخدم المصادق عليه فقط
CREATE POLICY "approve insert"
ON publicsv.approve FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- سياسة التحديث: الأدمن فقط
CREATE POLICY "approve update"
ON publicsv.approve FOR UPDATE
USING (publicsv.is_admin());

-- سياسة الحذف: الأدمن فقط
CREATE POLICY "approve delete"
ON publicsv.approve FOR DELETE
USING (publicsv.is_admin());

-- منح الصلاحيات
GRANT ALL ON publicsv.approve TO postgres, service_role;
GRANT SELECT, INSERT ON publicsv.approve TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- الخطوة 7: إصلاح RLS على users
-- ═══════════════════════════════════════════════════════════
ALTER TABLE publicsv.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE publicsv.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users select own" ON publicsv.users;
DROP POLICY IF EXISTS "users update own" ON publicsv.users;
DROP POLICY IF EXISTS "users admin all" ON publicsv.users;
DROP POLICY IF EXISTS "users insert" ON publicsv.users;

-- أي شخص مصادق عليه يستطيع قراءة بيانات المستخدمين
CREATE POLICY "users select"
ON publicsv.users FOR SELECT
USING (auth.uid() IS NOT NULL);

-- المستخدم يعدّل بياناته فقط + الأدمن
CREATE POLICY "users update"
ON publicsv.users FOR UPDATE
USING (auth.uid() = id OR publicsv.is_admin());

-- إدراج: فقط المستخدم المصادق عليه يدرج سجله
CREATE POLICY "users insert"
ON publicsv.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- حذف: الأدمن فقط
CREATE POLICY "users delete"
ON publicsv.users FOR DELETE
USING (publicsv.is_admin());

GRANT ALL ON publicsv.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON publicsv.users TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- الخطوة 8: تأكيد المستخدمين غير المؤكدين
-- ═══════════════════════════════════════════════════════════
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ═══════════════════════════════════════════════════════════
-- الخطوة 9: تشخيص - تحقق أن الـ trigger أُنشئ بنجاح
-- ═══════════════════════════════════════════════════════════
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';
