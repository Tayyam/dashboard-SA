import { useState } from 'react';
import { supabase } from '../core/supabaseClient';
import { cn } from '../lib/cn';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error: err, data } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: undefined },
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setMessage(
            'تم إنشاء الحساب. إذا لم يفتح التطبيق تلقائياً، يرجى إيقاف تأكيد البريد الإلكتروني من إعدادات Supabase.',
          );
          setLoading(false);
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      }
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      if (msg.includes('Invalid login credentials')) msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      if (msg.includes('User already registered')) msg = 'هذا البريد الإلكتروني مسجل مسبقاً';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 p-5">
      <div className="flex w-full max-w-[440px] flex-col gap-8 rounded-[20px] border border-border bg-white p-10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <img src="/logo.jpg" alt="Logo" className="h-full w-full rounded-[10px] object-contain" />
          </div>
          <h1 className="text-[22px] font-extrabold leading-snug text-fg">لوحة المعلومات التنفيذية</h1>
          <p className="text-sm text-fg-secondary">تحليلات بيانات الحجاج والمعتمرين</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              className={cn(
                'flex-1 cursor-pointer rounded-[10px] border-none py-2.5 text-sm font-semibold transition-all duration-200',
                mode === 'login' ? 'bg-white text-fg shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'bg-transparent text-fg-secondary',
              )}
              onClick={() => {
                setMode('login');
                setError(null);
                setMessage(null);
              }}
            >
              تسجيل دخول
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 cursor-pointer rounded-[10px] border-none py-2.5 text-sm font-semibold transition-all duration-200',
                mode === 'signup' ? 'bg-white text-fg shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'bg-transparent text-fg-secondary',
              )}
              onClick={() => {
                setMode('signup');
                setError(null);
                setMessage(null);
              }}
            >
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-right text-[13px] font-semibold text-fg-secondary">البريد الإلكتروني</label>
              <input
                type="email"
                className="w-full rounded-lg border border-border-strong px-3.5 py-3 font-sans text-sm transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-pale)] focus:outline-none ltr:text-left"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-right text-[13px] font-semibold text-fg-secondary">كلمة المرور</label>
              <input
                type="password"
                className="w-full rounded-lg border border-border-strong px-3.5 py-3 font-sans text-sm transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-pale)] focus:outline-none ltr:text-left"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {error && (
              <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2.5 text-center text-[13px] text-red-800">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2.5 text-center text-[13px] text-emerald-800">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full cursor-pointer rounded-lg border-none bg-primary py-3 font-sans text-sm font-bold text-white transition-all duration-200 hover:bg-primary-dark enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'جاري التنفيذ...' : mode === 'login' ? 'دخول' : 'إنشاء حساب جديد'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
