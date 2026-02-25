import { supabase } from '../core/supabaseClient';

interface PendingApprovalPageProps {
  userName: string;
}

export function PendingApprovalPage({ userName }: PendingApprovalPageProps) {
  return (
    <div className="auth-screen">
      <div className="auth-card auth-card-rtl">
        <div className="auth-brand">
          <div className="auth-brand-logo-wrap">
            <img src="/logo.jpg" alt="Project Logo" className="auth-brand-logo" />
          </div>
          <div>
            <h2 className="auth-title">مرحبًا {userName}</h2>
            <p className="auth-subtitle">تم ارسال طلبك وسيتم تسجيل حسابك قريبًا</p>
          </div>
        </div>

        <p className="auth-message">
          لا يمكنك الوصول إلى مكونات المنصة حتى يقوم المسؤول بالموافقة على الطلب.
        </p>

        <button className="auth-submit" onClick={() => supabase.auth.signOut()}>
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

