import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../core/supabaseClient';
import type { UserProfileRow } from '../core/authAccess';
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
  'created_at',
  'updated_at',
] as const;

/* ── Status helpers ────────────────────────────────────────────── */
const STATUS_LABEL: Record<AccountStatus, string> = {
  pending:  'معلّق',
  approved: 'مقبول',
  rejected: 'مرفوض',
};

const STATUS_CLASS: Record<AccountStatus, string> = {
  pending:  'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

function toISODate(val: unknown): string {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  if (typeof val === 'number') {
    const ms = Math.round((val - 25569) * 86400_000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  return '';
}

const toText = (val: unknown): string => (val == null ? '' : String(val).trim());
const toDbDate = (val: unknown): string | null => {
  const d = toISODate(val);
  return d || null;
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
      const { data, count, error: pe } = await db
        .from('pilgrims')
        .select(PILGRIMS_COLUMNS.join(','), { count: 'exact' })
        .order('id', { ascending: true })
        .range(from, to);
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

      const pilgrimsPayload = dataRows.map((row, idx) => {
        const contractRaw = toText(row.Flight_contract_type).toUpperCase();
        const genderRaw = toText(row.gender).toLowerCase();
        const insideRaw = toText(row.inside_kingdom).toLowerCase();

        return {
          booking_id: toText(row.nusuk_id) || toText(row.Booking_ID) || `SV-${idx + 1}`,
          gender: genderRaw === 'male' ? 'Male' : 'Female',
          name: toText(row.name),
          birth_date: toDbDate(row.birth_date),
          age: Number(row.Age ?? 0),
          guide_name: toText(row.guide_name),
          residence_country: toText(row.residence_country),
          nationality: toText(row.nationality),
          package_id: toText(row.package_id),
          package: toText(row.package_name),
          arrival_city: toText(row.Dep_Destination),
          departure_city: toText(row.Ret_Origin),
          arrival_hotel: toText(row['packages.first_hotel_name']),
          arrival_hotel_location: toText(row['packages.first_hotel_location']),
          departure_hotel: toText(row.last_hotel_name),
          departure_hotel_location: toText(row['packages.second_hotel_location']),
          arrival_date: toDbDate(row.Dep_Arr_Date),
          arrival_hotel_checkout_date: toDbDate(row['packages.first_hotel_check_out']),
          departure_city_arrival_date: toDbDate(row.last_hotel_check_in),
          departure_hotel_checkout_date: toDbDate(row.last_hotel_check_out),
          departure_date: toDbDate(row.Ret_Date),
          visa_status: toText(row.visa_status),
          inside_kingdom: insideRaw === 'true' || insideRaw === '1' || insideRaw === 'yes' || insideRaw === 'نعم',
          makkah_room_type: 'triple',
          madinah_room_type: 'triple',
          flight_contract_type: contractRaw === 'B2B' ? 'B2B' : 'GDS',
        };
      });

      // PostgREST requires a WHERE clause for DELETE in this project setup.
      const { error: deleteError } = await db.from('pilgrims').delete().gt('id', 0);
      if (deleteError) throw deleteError;

      const CHUNK_SIZE = 500;
      for (let i = 0; i < pilgrimsPayload.length; i += CHUNK_SIZE) {
        const chunk = pilgrimsPayload.slice(i, i + CHUNK_SIZE);
        const { error: insertError } = await db.from('pilgrims').insert(chunk);
        if (insertError) throw insertError;
      }

      if (showPilgrimsPreview) {
        setPreviewPage(1);
        await loadPilgrimsPreview(1);
      }
      setUploadInfo(`تم تحديث جدول الحجاج بنجاح (${pilgrimsPayload.length.toLocaleString()} سجل).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع ملف الحجاج.');
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
      <div className="admin-page">
        <p className="approval-error">غير مصرح لك بالوصول إلى صفحة إدارة الحسابات.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* Top bar */}
      <div className="admin-topbar">
        <div className="admin-topbar-title">
          <h2>إدارة الحسابات</h2>
          <span className="admin-topbar-sub">إجمالي {counts.all} حساب</span>
        </div>

        <div className="admin-topbar-actions">
          <input
            id="pilgrims-excel-upload"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handlePilgrimsExcelUpload}
          />
          <label
            htmlFor="pilgrims-excel-upload"
            className={`admin-refresh-btn${uploadingPilgrims ? ' is-disabled' : ''}`}
            style={uploadingPilgrims ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
            title="رفع ملف الحجاج (Sheet: main)"
          >
            {uploadingPilgrims ? 'جارٍ رفع الملف...' : 'رفع ملف الحجاج'}
          </label>
          <button
            className="admin-refresh-btn"
            onClick={() => {
              const next = !showPilgrimsPreview;
              setShowPilgrimsPreview(next);
              if (next) setPreviewPage(1);
            }}
            title="عرض أو إخفاء معاينة جدول الحجاج"
          >
            {showPilgrimsPreview ? 'إخفاء معاينة جدول الحجاج' : 'عرض معاينة جدول الحجاج'}
          </button>

          {/* Auto Approve Toggle */}
          <div className="auto-approve-toggle-wrap">
            <span className="auto-approve-label">الموافقة التلقائية</span>
            <button 
              className={`auto-approve-toggle${autoApprove ? ' is-on' : ''}`}
              onClick={toggleAutoApprove}
              disabled={settingLoading}
              title={autoApprove ? 'إيقاف الموافقة التلقائية' : 'تفعيل الموافقة التلقائية'}
            >
              <div className="auto-approve-knob" />
            </button>
          </div>

          <button className="admin-refresh-btn" onClick={load} title="تحديث" disabled={loading}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 4v6h6M20 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 10m16 4l-1.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="admin-stats-row">
        {([ ['all', 'الكل', '#0f172a'], ['pending', 'معلّق', '#d97706'], ['approved', 'مقبول', '#046A38'], ['rejected', 'مرفوض', '#b91c1c'] ] as const).map(([key, label, color]) => (
          <button
            key={key}
            className={`admin-stat-card${tab === key ? ' active' : ''}`}
            style={{ '--stat-color': color } as React.CSSProperties}
            onClick={() => setTab(key)}
          >
            <span className="admin-stat-num">{counts[key as keyof typeof counts]}</span>
            <span className="admin-stat-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Search + tabs */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <svg className="admin-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="admin-search"
            placeholder="بحث بالاسم أو الإيميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {error && <p className="approval-error">{error}</p>}
      {uploadInfo && <p className="approval-loading">{uploadInfo}</p>}

      {/* Table */}
      {loading ? (
        <p className="approval-loading">جاري التحميل...</p>
      ) : (
        <div className="admin-table-wrap">
          {visible.length === 0 ? (
            <p className="approval-empty">لا توجد نتائج.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الإيميل</th>
                  <th>الحالة</th>
                  <th>تاريخ الطلب</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.approvalId} className={actionId === row.approvalId ? 'row-loading' : ''}>
                    {/* User */}
                    <td>
                      <div className="admin-user-cell">
                        {row.avatar ? (
                          <img src={row.avatar} alt={row.name} className="admin-avatar" />
                        ) : (
                          <div className="admin-avatar fallback">
                            {row.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="admin-user-name">{row.name}</div>
                          {row.role === 'admin' && (
                            <span className="admin-role-badge">مسؤول</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="admin-email">{row.email}</td>

                    {/* Status */}
                    <td>
                      <span className={`admin-status-badge ${STATUS_CLASS[row.status]}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="admin-date">
                      {new Date(row.requestedAt).toLocaleDateString('ar-SA', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="admin-row-actions">
                        {row.status === 'pending' && (
                          <>
                            <button
                              className="approval-btn accept"
                              onClick={() => setStatus(row, 'approved')}
                              disabled={!!actionId}
                            >اعتماد</button>
                            <button
                              className="approval-btn reject"
                              onClick={() => setStatus(row, 'rejected')}
                              disabled={!!actionId}
                            >رفض</button>
                          </>
                        )}
                        {row.status === 'approved' && row.role !== 'admin' && (
                          <>
                            <button
                              className="approval-btn promote"
                              onClick={() => askConfirm(row, 'promote')}
                              disabled={!!actionId}
                              title="ترقية إلى مسؤول"
                            >
                              ترقية
                            </button>
                            <button
                              className="approval-btn reject"
                              onClick={() => askConfirm(row, 'revoke')}
                              disabled={!!actionId}
                            >سحب الموافقة</button>
                          </>
                        )}
                        {row.status === 'approved' && row.role === 'admin' && row.userId !== adminUserId && (
                          <button
                            className="approval-btn downgrade"
                            onClick={() => askConfirm(row, 'downgrade')}
                            disabled={!!actionId}
                            title="تنزيل إلى مستخدم عادي"
                          >
                            تنزيل لرتبة مستخدم
                          </button>
                        )}
                        {row.status === 'rejected' && (
                          <button
                            className="approval-btn accept"
                            onClick={() => setStatus(row, 'approved')}
                            disabled={!!actionId}
                          >إعادة قبول</button>
                        )}
                        
                        {/* Reset Password Button */}
                        <button
                          className="approval-btn reset-pwd"
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
                            className="approval-btn delete"
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

      {/* Pilgrims Table Preview (admin only) */}
      {showPilgrimsPreview && <div className="admin-pilgrims-preview">
        <div className="admin-topbar" style={{ marginTop: 6 }}>
          <div className="admin-topbar-title">
            <h2>معاينة جدول الحجاج الأصلي</h2>
            <span className="admin-topbar-sub">
              إجمالي {previewTotal.toLocaleString()} سجل
            </span>
          </div>
        </div>

        {previewError && <p className="approval-error">{previewError}</p>}
        {previewLoading ? (
          <p className="approval-loading">جاري تحميل المعاينة...</p>
        ) : (
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            {previewRows.length === 0 ? (
              <p className="approval-empty">لا توجد بيانات في جدول الحجاج.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    {PILGRIMS_COLUMNS.map((col) => (
                      <th key={col}>{col}</th>
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
          <div className="pilgrims-table-pagination">
            <button
              className="pt-btn"
              onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
              disabled={previewPage === 1 || previewLoading}
            >
              ‹ السابق
            </button>
            <span className="pt-pages">
              {previewPage} / {previewPages}
            </span>
            <button
              className="pt-btn"
              onClick={() => setPreviewPage((p) => Math.min(previewPages, p + 1))}
              disabled={previewPage === previewPages || previewLoading}
            >
              التالي ›
            </button>
          </div>
        )}
      </div>}

      {/* Confirm dialog */}
      {confirmRow && confirmAction && (
        <div className="admin-confirm-backdrop" onClick={() => { setConfirmRow(null); setConfirmAction(null); }}>
          <div className="admin-confirm-box" onClick={(e) => e.stopPropagation()}>
            <p className="admin-confirm-msg">
              {confirmAction === 'delete' && `هل أنت متأكد من حذف حساب "${confirmRow.name}" نهائياً؟`}
              {confirmAction === 'revoke' && `هل تريد سحب موافقة "${confirmRow.name}"؟`}
              {confirmAction === 'reset_pwd' && `إعادة تعيين كلمة السر للمستخدم "${confirmRow.name}"`}
              {confirmAction === 'promote' && `هل تريد ترقية "${confirmRow.name}" ليكون مسؤولاً (Admin)؟`}
              {confirmAction === 'downgrade' && `هل تريد تنزيل صلاحيات "${confirmRow.name}" لمستخدم عادي؟`}
            </p>
            
            {confirmAction === 'reset_pwd' && (
              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="كلمة السر الجديدة..."
                  value={resetPwdValue}
                  onChange={(e) => setResetPwdValue(e.target.value)}
                  autoFocus
                />
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  6 أحرف على الأقل
                </p>
              </div>
            )}

            <div className="admin-confirm-actions">
              <button
                className={`approval-btn ${
                  confirmAction === 'delete' || confirmAction === 'revoke' || confirmAction === 'downgrade' 
                    ? 'reject' 
                    : 'accept'
                }`}
                onClick={handleConfirm}
                disabled={confirmAction === 'reset_pwd' && resetPwdValue.length < 6}
              >
                {confirmAction === 'reset_pwd' ? 'تغيير' : 'تأكيد'}
              </button>
              <button className="profile-cancel-btn" onClick={() => { setConfirmRow(null); setConfirmAction(null); }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
