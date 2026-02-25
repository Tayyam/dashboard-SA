-- ═══════════════════════════════════════════════════════════════
-- 1. تعطيل تأكيد البريد الإلكتروني تلقائياً (تأكيد جميع المستخدمين الحاليين)
-- ═══════════════════════════════════════════════════════════════
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 2. إضافة عمود الهاتف إذا لم يكن موجوداً
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE publicsv.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 3. إصلاح دالة is_admin لتجنب التكرار في RLS
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION publicsv.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM publicsv.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 4. حذف الـ trigger القديم وإعادة إنشائه بشكل صحيح
-- ═══════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_auto_approve boolean := false;
  _is_admin boolean := false;
  _approval_status text := 'pending';
BEGIN
  -- Check if admin email
  IF NEW.email = 'admin@test.com' THEN
    _is_admin := true;
  END IF;

  -- Check auto_approve setting
  BEGIN
    SELECT (value::text = 'true' OR value = 'true'::jsonb)
    INTO _is_auto_approve
    FROM publicsv.settings
    WHERE key = 'auto_approve';
  EXCEPTION WHEN OTHERS THEN
    _is_auto_approve := false;
  END;

  -- Determine status
  IF _is_admin OR _is_auto_approve THEN
    _approval_status := 'approved';
  END IF;

  -- Insert user profile (skip if already exists)
  INSERT INTO publicsv.users (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    CASE WHEN _is_admin THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert approval record (skip if already exists)
  INSERT INTO publicsv.approve (user_id, status, approved_at)
  VALUES (
    NEW.id,
    _approval_status,
    CASE WHEN _approval_status = 'approved' THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- 5. إصلاح policy للـ approve table للسماح للـ trigger بالإدراج
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "approve insert own request" ON publicsv.approve;
CREATE POLICY "approve insert own request"
ON publicsv.approve
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- منح صلاحية القراءة على settings لأي مستخدم
GRANT SELECT ON publicsv.settings TO anon, authenticated;
GRANT DELETE ON publicsv.users TO authenticated;
GRANT DELETE ON publicsv.approve TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 6. تأكيد تفعيل settings table مع قيمة auto_approve
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS publicsv.settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now(),
  updated_by uuid references publicsv.users(id)
);

ALTER TABLE publicsv.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings read all" ON publicsv.settings;
CREATE POLICY "settings read all" ON publicsv.settings
FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings admin write" ON publicsv.settings;
CREATE POLICY "settings admin write" ON publicsv.settings
FOR ALL USING (publicsv.is_admin());

INSERT INTO publicsv.settings (key, value) 
VALUES ('auto_approve', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON publicsv.settings TO anon, authenticated, service_role;
