import { supabase } from '../core/supabaseClient';
import { clearDashboardEmbedSessionFlag } from '../core/embedPresentation';

interface PendingApprovalPageProps {
  userName: string;
}

export function PendingApprovalPage({ userName }: PendingApprovalPageProps) {
  return (
    <div className="box-border flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-emerald-50 from-0% via-primary-pale via-50% to-slate-50 to-100% p-5 font-sans">
      <div className="box-border flex w-full max-w-[460px] flex-col items-center gap-5 rounded-3xl border border-primary/10 bg-white p-10 text-center shadow-[0_24px_48px_-12px_rgba(4,106,56,0.12),0_0_0_1px_rgba(4,106,56,0.06)]">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[20px] border-2 border-primary/10 shadow-[0_8px_24px_rgba(4,106,56,0.15)]">
          <img src="/logo.jpg" alt="Logo" className="block h-full w-full object-cover" />
        </div>

        <div className="flex h-[72px] w-[72px] animate-[pending-pulse_2s_ease-in-out_infinite] items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
          <svg className="h-[38px] w-[38px]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="none" />
            <path
              d="M32 18V32L41 41"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="m-0 text-2xl font-extrabold leading-snug text-fg">مرحبًا، {userName}</h2>
        <p className="-mt-2 m-0 text-[15px] font-semibold text-fg-secondary">طلبك قيد المراجعة</p>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-5 py-2 text-[13px] font-bold text-amber-900">
          <span className="h-2 w-2 shrink-0 animate-[pending-dot-blink_1.4s_ease-in-out_infinite] rounded-full bg-amber-500" />
          في انتظار موافقة المسؤول
        </div>

        <p className="m-0 max-w-[340px] text-sm leading-loose text-fg-secondary">
          تم استلام طلب إنشاء حسابك بنجاح. سيتم تفعيل حسابك فور موافقة المسؤول على الطلب.
        </p>

        <button
          type="button"
          className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-border-strong bg-transparent px-7 py-3 font-sans text-sm font-semibold text-fg-secondary transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          onClick={() => {
            clearDashboardEmbedSessionFlag();
            void supabase.auth.signOut();
          }}
        >
          <svg
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
