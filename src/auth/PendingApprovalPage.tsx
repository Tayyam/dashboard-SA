import { supabase } from '../core/supabaseClient';
import '../styles/pending.css';

interface PendingApprovalPageProps {
  userName: string;
}

export function PendingApprovalPage({ userName }: PendingApprovalPageProps) {
  return (
    <div className="pending-page">
      <div className="pending-card">
        <div className="pending-logo-wrap">
          <img src="/logo.jpg" alt="Logo" className="pending-logo" />
        </div>

        <div className="pending-icon-wrap">
          <svg className="pending-clock-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M32 18V32L41 41" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="pending-title">مرحبًا، {userName}</h2>
        <p className="pending-subtitle">طلبك قيد المراجعة</p>

        <div className="pending-status-badge">
          <span className="pending-dot" />
          في انتظار موافقة المسؤول
        </div>

        <p className="pending-desc">
          تم استلام طلب إنشاء حسابك بنجاح. سيتم تفعيل حسابك فور موافقة المسؤول على الطلب.
        </p>

        <button
          className="pending-logout-btn"
          onClick={() => supabase.auth.signOut()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
