import { useState } from 'react';
import { supabase } from '../core/supabaseClient';
import '../styles/auth.css';

export default function AuthPage() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Use the actual production URL or current origin
      const targetUrl = window.location.hostname === 'localhost' 
        ? window.location.origin 
        : 'https://svhajjdashborad.netlify.app';

      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetUrl,
        },
      });
      if (err) throw err;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
    } catch (err) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-simple">
        <div className="auth-brand-simple">
          <div className="auth-logo-wrap-simple">
            <img src="/logo.jpg" alt="Logo" className="auth-logo-simple" />
          </div>
          <h1 className="auth-title-simple">لوحة المعلومات التنفيذية</h1>
          <p className="auth-subtitle-simple">تحليلات بيانات الحجاج والمعتمرين</p>
        </div>

        <div className="auth-form-container-simple">
          
          <div className="auth-header-simple">
            <h2 className="auth-welcome-simple">تسجيل الدخول</h2>
            <p className="auth-sub-text-simple">يرجى تسجيل الدخول للمتابعة</p>
          </div>

          {!isAdminMode ? (
            <>
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width="20" height="20" />
                <span>المتابعة باستخدام Google</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleAdminLogin} className="auth-input-group">
              <div className="auth-input-group">
                <label className="auth-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">كلمة المرور</label>
                <input
                  type="password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري التحقق...' : 'دخول المسؤول'}
              </button>

              <button
                type="button"
                className="auth-admin-toggle-subtle"
                onClick={() => setIsAdminMode(false)}
                style={{ marginTop: '16px', width: '100%', textAlign: 'center' }}
              >
                العودة
              </button>
            </form>
          )}

          {error && <div className="auth-error-msg">{error}</div>}
        </div>
      </div>

      {!isAdminMode && (
        <button
          className="auth-admin-corner-btn"
          onClick={() => setIsAdminMode(true)}
          title="Admin Login"
        >
          Admin Login
        </button>
      )}
    </div>
  );
}
