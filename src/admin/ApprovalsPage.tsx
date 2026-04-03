import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../core/supabaseClient';
import { cn } from '../lib/cn';
import type { UserProfileRow } from '../core/authAccess';
import { pilgrimFromRow, pilgrimToDbInsert, stripNullInsertFields } from '../core/pilgrimFromRow';
import * as XLSX from 'xlsx';

interface ApprovalsPageProps {
  adminUserId: string;
}

type AccountStatus = 'pending' | 'approved' | 'rejected';
type TabFilter = 'all' | AccountStatus;

interface AccountRow {
  approvalId: string;
  userId: string;
  status: AccountStatus;
  requestedAt: string;
  approvedAt: string | null;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
}

type PilgrimPreviewRow = Record<string, unknown>;
const PILGRIMS_COLUMNS = [
  'id',
  'group_id',
  'booking_id',
  'gender',
  'name',
  'birth_date',
  'age',
  'guide_name',
  'residence_country',
  'nationality',
  'package_id',
  'package',
  'arrival_city',
  'departure_city',
  'arrival_hotel',
  'arrival_hotel_location',
  'departure_hotel',
  'departure_hotel_location',
  'arrival_date',
  'arrival_hotel_checkout_date',
  'departure_city_arrival_date',
  'departure_hotel_checkout_date',
  'departure_date',
  'visa_status',
  'inside_kingdom',
  'makkah_room_type',
  'madinah_room_type',
  'flight_contract_type',
  'first_stop_name',
  'first_stop_location',
  'first_stop_check_in',
  'first_stop_check_out',
  'second_stop_name',
  'second_stop_location',
  'second_stop_check_in',
  'second_stop_check_out',
  'third_stop_name',
  'third_stop_location',
  'third_stop_check_in',
  'third_stop_check_out',
  'first_entry_place',
  'arrival_airport',
  'last_exit_place',
  'departure_airport',
  'created_at',
  'updated_at',
] as const;

function pilgrimPreviewColumnLabel(col: string): string {
  if (col === 'package_id') return 'package type';
  return col;
}

/* ── Status helpers ────────────────────────────────────────────── */
const STATUS_LABEL: Record<AccountStatus, string> = {
  pending:  'معلّق',
  approved: 'مقبول',
  rejected: 'مرفوض',
};

const STATUS_BADGE_CLASS: Record<AccountStatus, string> = {
  pending:  'bg-amber-100 text-amber-900 border-amber-200',
  approved: 'bg-primary-pale text-primary-dark border-emerald-300',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

function formatSupabaseError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string };
    const parts = [e.message, e.details, e.hint].filter((x) => typeof x === 'string' && x.trim());
    if (parts.length) return parts.join(' — ');
  }
  return 'فشل رفع ملف الحجاج.';
}

const isMissingGroupIdColumnError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const maybe = err as { code?: string; message?: string };
  const msg = (maybe.message ?? '').toLowerCase();
  return (
    (maybe.code === 'PGRST204' && msg.includes("'group_id'")) ||
    (maybe.code === '42703' && msg.includes('group_id'))
  );
};

export function ApprovalsPage({ adminUserId }: ApprovalsPageProps) {
  const db = supabase.schema('publicsv');
  const PREVIEW_PAGE_SIZE = 20;

  const [rows, setRows]                   = useState<AccountRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionId, setActionId]           = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [tab, setTab]                     = useState<TabFilter>('pending');
  const [search, setSearch]               = useState('');
  const [confirmRow, setConfirmRow]       = useState<AccountRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'revoke' | 'reset_pwd' | 'promote' | 'downgrade' | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState('');
  const [autoApprove, setAutoApprove]     = useState<boolean>(false);
  const [settingLoading, setSettingLoading] = useState(false);
  const [uploadingPilgrims, setUploadingPilgrims] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [previewRows, setPreviewRows] = useState<PilgrimPreviewRow[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showPilgrimsPreview, setShowPilgrimsPreview] = useState(false);

  /* ── Load all accounts & settings ─────────────────────────────── */
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load accounts
      const { data: approvals, error: ae } = await db
        .from('approve')
        .select('id,user_id,status,requested_at,approved_at')
        .order('requested_at', { ascending: false });
      if (ae) throw ae;

      // Load auto_approve setting
      const { data: setting } = await db
        .from('settings')
        .select('value')
        .eq('key', 'auto_approve')
        .maybeSingle();
      if (setting) {
        const v = setting.value;
        setAutoApprove(v === true || v === 'true' || v === 1 || v === '1');
      }

      const uids = Array.from(new Set((approvals ?? []).map((a) => a.user_id)));
      let usersMap = new Map<string, UserProfileRow>();
      if (uids.length > 0) {
        const { data: users, error: ue } = await db
          .from('users')
          .select('id,email,name,avatar_url,role')
          .in('id', uids);
        if (ue) throw ue;
        usersMap = new Map((users ?? []).map((u) => [u.id, u as UserProfileRow]));
      }

      const mapped: AccountRow[] = (approvals ?? []).map((a) => {
        const u = usersMap.get(a.user_id);
        return {
          approvalId:  a.id,
          userId:      a.user_id,
          status:      (a.status ?? 'pending') as AccountStatus,
          requestedAt: a.requested_at,
          approvedAt:  a.approved_at ?? null,
          email:       u?.email ?? '-',
          name:        u?.name  ?? 'مجهول',
          avatar:      u?.avatar_url ?? null,
          role:        u?.role  ?? 'user',
        };
      });
      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoApprove = async () => {
    const nextValue = !autoApprove;
    setSettingLoading(true);
    try {
      const { error: se } = await db
        .from('settings')
        .upsert({ 
          key: 'auto_approve', 
          value: nextValue, 
          updated_at: new Date().toISOString(),
          updated_by: adminUserId
        });
      if (se) throw se;
      setAutoApprove(nextValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الإعدادات');
    } finally {
      setSettingLoading(false);
    }
  };

  const loadPilgrimsPreview = async (page: number) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const from = (page - 1) * PREVIEW_PAGE_SIZE;
      const to = from + PREVIEW_PAGE_SIZE - 1;
      let { data, count, error: pe } = await db
        .from('pilgrims')
        .select(PILGRIMS_COLUMNS.join(','), { count: 'exact' })
        .order('id', { ascending: true })
        .range(from, to);
      if (pe && isMissingGroupIdColumnError(pe)) {
        const fallbackCols = PILGRIMS_COLUMNS.filter((c) => c !== 'group_id').join(',');
        const retry = await db
          .from('pilgrims')
          .select(fallbackCols, { count: 'exact' })
          .order('id', { ascending: true })
          .range(from, to);
        data = retry.data;
        count = retry.count;
        pe = retry.error;
      }
      if (pe) throw pe;
      setPreviewRows(((data ?? []) as unknown) as PilgrimPreviewRow[]);
      setPreviewTotal(count ?? 0);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'فشل تحميل معاينة جدول الحجاج');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { data, error: roleError } = await db
          .from('users')
          .select('role')
          .eq('id', adminUserId)
          .single();
        if (roleError) throw roleError;
        const isAdmin = data?.role === 'admin';
        if (cancelled) return;
        setHasAdminAccess(isAdmin);
        if (!isAdmin) return;
        await load();
      } catch (err) {
        if (cancelled) return;
        setHasAdminAccess(false);
        setError(err instanceof Error ? err.message : 'غير مصرح لك بالدخول لهذه الصفحة');
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [adminUserId]);

  useEffect(() => {
    if (hasAdminAccess !== true || !showPilgrimsPreview) return;
    loadPilgrimsPreview(previewPage);
  }, [previewPage, hasAdminAccess, showPilgrimsPreview]);

  /* ── Derived counts ────────────────────────────────────────────── */
  const counts = useMemo(() => ({
    all:      rows.length,
    pending:  rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  }), [rows]);

  /* ── Filtered list ─────────────────────────────────────────────── */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchTab = tab === 'all' || r.status === tab;
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [rows, tab, search]);

  /* ── Actions ───────────────────────────────────────────────────── */
  const setStatus = async (row: AccountRow, newStatus: AccountStatus) => {
    setActionId(row.approvalId);
    setError(null);
    try {
      const now = new Date().toISOString();
      const { error: ae } = await db
        .from('approve')
        .update({ status: newStatus, approved_at: now, approved_by: adminUserId })
        .eq('id', row.approvalId);
      if (ae) throw ae;

      if (newStatus === 'approved') {
        const { error: ue } = await db
          .from('users').update({ role: 'user' }).eq('id', row.userId);
        if (ue) throw ue;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الحالة');
    } finally {
      setActionId(null);
    }
  };

  const setRole = async (row: AccountRow, newRole: string) => {
    setActionId(row.approvalId);
    setError(null);
    try {
      const { error: ue } = await db
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', row.userId);
      if (ue) throw ue;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تغيير صلاحيات المستخدم');
    } finally {
      setActionId(null);
      setConfirmRow(null);
      setConfirmAction(null);
    }
  };

  const deleteAccount = async (row: AccountRow) => {
    setActionId(row.approvalId);
    setError(null);
    try {
      const { data, error: callErr } = await supabase.functions.invoke('admin-delete-user', {
        body: { target_user_id: row.userId },
      });
      if (callErr) throw callErr;
      if (data?.error) throw new Error(data.error);

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الحساب');
    } finally {
      setActionId(null);
      setConfirmRow(null);
      setConfirmAction(null);
    }
  };

  const resetPassword = async (row: AccountRow, pwd: string) => {
    if (!pwd || pwd.length < 6) {
      setError('كلمة السر يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setActionId(row.approvalId);
    setError(null);
    try {
      const { data, error: callErr } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: row.userId, new_password: pwd },
      });
      if (callErr) throw callErr;
      if (data?.error) throw new Error(data.error);
      
      setResetPwdValue('');
      setConfirmRow(null);
      setConfirmAction(null);
      // Optional: show a success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إعادة تعيين كلمة السر');
    } finally {
      setActionId(null);
    }
  };

  const handlePilgrimsExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingPilgrims(true);
    setUploadInfo(null);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const mainSheet = workbook.Sheets.main;
      if (!mainSheet) {
        throw new Error('لم يتم العثور على sheet باسم main داخل ملف الإكسل.');
      }

      type Row = Record<string, unknown>;
      const dataRows = XLSX.utils.sheet_to_json<Row>(mainSheet, { defval: null });
      if (dataRows.length === 0) {
        throw new Error('Sheet main فارغة ولا تحتوي على بيانات.');
      }

      const pilgrimsPayload = dataRows.map((row, idx) =>
        stripNullInsertFields(pilgrimToDbInsert(pilgrimFromRow(row, idx)))
      );

      // Keep one row per nusuk_id (id) to avoid PK collisions during import.
      const dedupedMap = new Map<number, (typeof pilgrimsPayload)[number]>();
      for (const row of pilgrimsPayload) {
        const id = typeof row.id === 'number' ? row.id : Number(row.id);
        if (Number.isFinite(id)) dedupedMap.set(id, row);
      }
      const dedupedPilgrimsPayload = Array.from(dedupedMap.values());

      // PostgREST requires a WHERE clause for DELETE in this project setup.
      const { error: deleteError } = await db.from('pilgrims').delete().gt('id', 0);
      if (deleteError) throw deleteError;

      // Detect support for group_id column once, then choose payload shape.
      let supportsGroupIdColumn = true;
      {
        const probe = await db.from('pilgrims').select('group_id').limit(1);
        if (probe.error && isMissingGroupIdColumnError(probe.error)) {
          supportsGroupIdColumn = false;
        } else if (probe.error) {
          throw probe.error;
        }
      }

      const CHUNK_SIZE = 500;
      for (let i = 0; i < dedupedPilgrimsPayload.length; i += CHUNK_SIZE) {
        const chunk = dedupedPilgrimsPayload.slice(i, i + CHUNK_SIZE);
        const payload =
          supportsGroupIdColumn ? chunk : chunk.map(({ group_id: _ignored, ...rest }) => rest);
        const { error: insertError } = await db.from('pilgrims').insert(payload);
        if (insertError) throw insertError;
      }

      if (showPilgrimsPreview) {
        setPreviewPage(1);
        await loadPilgrimsPreview(1);
      }
      const droppedDuplicates = pilgrimsPayload.length - dedupedPilgrimsPayload.length;
      setUploadInfo(
        droppedDuplicates > 0
          ? `تم تحديث جدول الحجاج بنجاح (${dedupedPilgrimsPayload.length.toLocaleString()} سجل) مع حذف ${droppedDuplicates.toLocaleString()} سجل مكرر في nusuk_id.`
          : `تم تحديث جدول الحجاج بنجاح (${dedupedPilgrimsPayload.length.toLocaleString()} سجل).`,
      );
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setUploadingPilgrims(false);
    }
  };

  /* ── Confirm helpers ───────────────────────────────────────────── */
  const askConfirm = (row: AccountRow, action: 'delete' | 'revoke' | 'reset_pwd' | 'promote' | 'downgrade') => {
    setConfirmRow(row);
    setConfirmAction(action);
    if (action === 'reset_pwd') setResetPwdValue('');
  };

  const handleConfirm = () => {
    if (!confirmRow) return;
    if (confirmAction === 'delete') deleteAccount(confirmRow);
    if (confirmAction === 'revoke') setStatus(confirmRow, 'rejected');
    if (confirmAction === 'reset_pwd') resetPassword(confirmRow, resetPwdValue);
    if (confirmAction === 'promote') setRole(confirmRow, 'admin');
    if (confirmAction === 'downgrade') setRole(confirmRow, 'user');
  };

  const previewPages = Math.max(1, Math.ceil(previewTotal / PREVIEW_PAGE_SIZE));

  /* ── Render ────────────────────────────────────────────────────── */
  if (hasAdminAccess === false) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-page px-6 pb-8 pt-5 rtl">
        <p className="text-sm font-semibold text-red-700">غير مصرح لك بالوصول إلى صفحة إدارة الحسابات.</p>
      </div>
    );
  }

  const refreshBtnClass =
    'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary-light bg-primary-pale px-3.5 py-1.5 font-sans text-xs font-bold text-primary transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-page px-6 pb-8 pt-5 rtl">

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight text-gray-900">إدارة الحسابات</h2>
          <span className="text-xs font-medium text-gray-500">إجمالي {counts.all} حساب</span>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <input
            id="pilgrims-excel-upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handlePilgrimsExcelUpload}
          />
          <label
            htmlFor="pilgrims-excel-upload"
            className={cn(refreshBtnClass, uploadingPilgrims && 'pointer-events-none opacity-60')}
            title="رفع ملف الحجاج (Sheet: main)"
          >
            {uploadingPilgrims ? 'جارٍ رفع الملف...' : 'رفع ملف الحجاج'}
          </label>
          <button
            type="button"
            className={refreshBtnClass}
            onClick={() => {
              const next = !showPilgrimsPreview;
              setShowPilgrimsPreview(next);
              if (next) setPreviewPage(1);
            }}
            title="عرض أو إخفاء معاينة جدول الحجاج"
          >
            {showPilgrimsPreview ? 'إخفاء معاينة جدول الحجاج' : 'عرض معاينة جدول الحجاج'}
          </button>

          <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-white px-3 py-1.5">
            <span className="text-xs font-bold text-gray-700">الموافقة التلقائية</span>
            <button
              type="button"
              className={cn(
                'relative h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full border-none p-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                autoApprove ? 'bg-primary' : 'bg-gray-300',
              )}
              onClick={toggleAutoApprove}
              disabled={settingLoading}
              title={autoApprove ? 'إيقاف الموافقة التلقائية' : 'تفعيل الموافقة التلقائية'}
            >
              <div
                className={cn(
                  'absolute top-[3px] h-4 w-4 rounded-full bg-white transition-transform',
                  autoApprove ? '-translate-x-5' : '',
                )}
                style={{ right: 3 }}
              />
            </button>
          </div>

          <button type="button" className={refreshBtnClass} onClick={load} title="تحديث" disabled={loading}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 4v6h6M20 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 10m16 4l-1.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2.5 max-md:grid-cols-2">
        {(
          [
            ['all', 'الكل', '#0f172a'],
            ['pending', 'معلّق', '#d97706'],
            ['approved', 'مقبول', '#046A38'],
            ['rejected', 'مرفوض', '#b91c1c'],
          ] as const
        ).map(([key, label, color]) => (
          <button
            key={key}
            type="button"
            className={cn(
              'flex cursor-pointer flex-col gap-1 rounded-xl border-2 bg-white px-4 py-3.5 text-right transition-all duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
              tab !== key && 'border-border',
            )}
            style={
              tab === key
                ? ({ borderColor: color, background: `color-mix(in srgb, ${color} 8%, white)` } as React.CSSProperties)
                : undefined
            }
            onClick={() => setTab(key)}
          >
            <span className="text-[28px] font-extrabold leading-none" style={{ color }}>
              {counts[key as keyof typeof counts]}
            </span>
            <span className="text-xs font-semibold text-gray-500">{label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-[360px] flex-1">
          <svg
            className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="w-full rounded-lg border border-border-strong bg-white py-2 ps-9 pe-9 text-[13px] text-gray-900 outline-none transition-shadow rtl:text-right focus:border-primary focus:shadow-[0_0_0_3px_rgba(4,106,56,0.12)]"
            placeholder="بحث بالاسم أو الإيميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="absolute start-2.5 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent p-0.5 text-xs text-gray-400 hover:text-gray-700"
              onClick={() => setSearch('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
      {uploadInfo && <p className="text-sm text-fg-secondary">{uploadInfo}</p>}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-fg-secondary">جاري التحميل...</p>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-border bg-white shadow-card-sm">
          {visible.length === 0 ? (
            <p className="px-2 py-3 text-sm text-fg-secondary">لا توجد نتائج.</p>
          ) : (
            <table className="w-full border-collapse text-[13px] rtl:text-right">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-[11px] font-bold tracking-wide text-gray-500 uppercase">
                    المستخدم
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-[11px] font-bold tracking-wide text-gray-500 uppercase max-md:hidden">
                    الإيميل
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-[11px] font-bold tracking-wide text-gray-500 uppercase">
                    الحالة
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-[11px] font-bold tracking-wide text-gray-500 uppercase max-md:hidden">
                    تاريخ الطلب
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-[11px] font-bold tracking-wide text-gray-500 uppercase">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={row.approvalId}
                    className={cn(
                      'border-b border-border transition-colors last:border-b-0 hover:bg-gray-50',
                      actionId === row.approvalId && 'pointer-events-none opacity-50',
                    )}
                  >
                    <td className="px-4 py-2.5 align-middle">
                      <div className="flex items-center gap-2.5">
                        {row.avatar ? (
                          <img src={row.avatar} alt={row.name} className="h-9 w-9 shrink-0 rounded-full border border-border object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-primary text-sm font-bold text-white">
                            {row.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-[13px] font-semibold text-gray-900">{row.name}</div>
                          {row.role === 'admin' && (
                            <span className="mt-0.5 inline-block rounded-full border border-amber-200 bg-amber-100 px-1.5 py-px text-[10px] font-bold text-amber-900">
                              مسؤول
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="max-md:hidden px-4 py-2.5 align-middle text-right text-xs text-gray-600 ltr:text-right" dir="ltr">
                      {row.email}
                    </td>

                    <td className="px-4 py-2.5 align-middle">
                      <span
                        className={cn(
                          'inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap',
                          STATUS_BADGE_CLASS[row.status],
                        )}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>

                    <td className="max-md:hidden whitespace-nowrap px-4 py-2.5 align-middle text-xs text-gray-500">
                      {new Date(row.requestedAt).toLocaleDateString('en-US', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-2.5 align-middle">
                      <div className="flex flex-nowrap items-center gap-1.5">
                        {row.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-transparent bg-primary px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => setStatus(row, 'approved')}
                              disabled={!!actionId}
                            >
                              اعتماد
                            </button>
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-red-800 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => setStatus(row, 'rejected')}
                              disabled={!!actionId}
                            >
                              رفض
                            </button>
                          </>
                        )}
                        {row.status === 'approved' && row.role !== 'admin' && (
                          <>
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-sky-200 bg-sky-100 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-sky-800 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => askConfirm(row, 'promote')}
                              disabled={!!actionId}
                              title="ترقية إلى مسؤول"
                            >
                              ترقية
                            </button>
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-red-800 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => askConfirm(row, 'revoke')}
                              disabled={!!actionId}
                            >
                              سحب الموافقة
                            </button>
                          </>
                        )}
                        {row.status === 'approved' && row.role === 'admin' && row.userId !== adminUserId && (
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-amber-900 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => askConfirm(row, 'downgrade')}
                            disabled={!!actionId}
                            title="تنزيل إلى مستخدم عادي"
                          >
                            تنزيل لرتبة مستخدم
                          </button>
                        )}
                        {row.status === 'rejected' && (
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-transparent bg-primary px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setStatus(row, 'approved')}
                            disabled={!!actionId}
                          >
                            إعادة قبول
                          </button>
                        )}

                        <button
                          type="button"
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-2 py-1.5 text-slate-700 transition-colors hover:bg-slate-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => askConfirm(row, 'reset_pwd')}
                          disabled={!!actionId}
                          title="إعادة تعيين كلمة السر"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>

                        {row.role !== 'admin' && (
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1.5 text-rose-900 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => askConfirm(row, 'delete')}
                            disabled={!!actionId}
                            title="حذف الحساب نهائياً"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showPilgrimsPreview && (
        <div className="flex flex-col gap-2 border-t border-border pt-2">
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-extrabold leading-tight text-gray-900">معاينة جدول الحجاج الأصلي</h2>
            <span className="text-xs font-medium text-gray-500">إجمالي {previewTotal.toLocaleString()} سجل</span>
          </div>
        </div>

        {previewError && <p className="text-sm font-semibold text-red-700">{previewError}</p>}
        {previewLoading ? (
          <p className="text-sm text-fg-secondary">جاري تحميل المعاينة...</p>
        ) : (
          <div className="overflow-hidden overflow-x-auto rounded-[14px] border border-border bg-white shadow-card-sm">
            {previewRows.length === 0 ? (
              <p className="px-2 py-3 text-sm text-fg-secondary">لا توجد بيانات في جدول الحجاج.</p>
            ) : (
              <table className="w-full border-collapse text-[13px] rtl:text-right">
                <thead>
                  <tr>
                    {PILGRIMS_COLUMNS.map((col) => (
                      <th key={col}>{pilgrimPreviewColumnLabel(col)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, idx) => (
                    <tr key={String(r.id ?? idx)}>
                      {PILGRIMS_COLUMNS.map((col) => {
                        const value = r[col];
                        return <td key={col}>{value == null || value === '' ? '—' : String(value)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {previewPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-4 py-2.5">
            <button
              type="button"
              className="cursor-pointer rounded-md border border-border bg-page px-3.5 py-1 text-xs text-fg transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
              disabled={previewPage === 1 || previewLoading}
            >
              ‹ السابق
            </button>
            <span className="min-w-[60px] text-center text-xs text-fg-secondary">
              {previewPage} / {previewPages}
            </span>
            <button
              type="button"
              className="cursor-pointer rounded-md border border-border bg-page px-3.5 py-1 text-xs text-fg transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setPreviewPage((p) => Math.min(previewPages, p + 1))}
              disabled={previewPage === previewPages || previewLoading}
            >
              التالي ›
            </button>
          </div>
        )}
      </div>
      )}

      {confirmRow && confirmAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 p-[18px]"
          onClick={() => {
            setConfirmRow(null);
            setConfirmAction(null);
          }}
          role="presentation"
        >
          <div
            className="flex w-full max-w-[420px] flex-col gap-4 rounded-[14px] border border-border bg-white p-5 pb-4 shadow-[0_20px_40px_rgba(15,23,42,0.2)] rtl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <p className="text-sm font-semibold leading-relaxed text-gray-800">
              {confirmAction === 'delete' && `هل أنت متأكد من حذف حساب "${confirmRow.name}" نهائياً؟`}
              {confirmAction === 'revoke' && `هل تريد سحب موافقة "${confirmRow.name}"؟`}
              {confirmAction === 'reset_pwd' && `إعادة تعيين كلمة السر للمستخدم "${confirmRow.name}"`}
              {confirmAction === 'promote' && `هل تريد ترقية "${confirmRow.name}" ليكون مسؤولاً (Admin)؟`}
              {confirmAction === 'downgrade' && `هل تريد تنزيل صلاحيات "${confirmRow.name}" لمستخدم عادي؟`}
            </p>

            {confirmAction === 'reset_pwd' && (
              <div className="mt-1">
                <input
                  type="text"
                  className="w-full rounded-lg border border-border-strong px-3.5 py-3 font-sans text-sm transition-all focus:border-primary focus:shadow-[0_0_0_3px_#e8f5ee] focus:outline-none ltr:text-left"
                  placeholder="كلمة السر الجديدة..."
                  value={resetPwdValue}
                  onChange={(e) => setResetPwdValue(e.target.value)}
                  autoFocus
                />
                <p className="mt-1 text-[11px] text-fg-secondary">6 أحرف على الأقل</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1 rounded-lg border border-transparent px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  confirmAction === 'delete' || confirmAction === 'revoke' || confirmAction === 'downgrade'
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-primary text-white hover:bg-primary-dark',
                )}
                onClick={handleConfirm}
                disabled={confirmAction === 'reset_pwd' && resetPwdValue.length < 6}
              >
                {confirmAction === 'reset_pwd' ? 'تغيير' : 'تأكيد'}
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-fg-secondary transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-fg"
                onClick={() => {
                  setConfirmRow(null);
                  setConfirmAction(null);
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
