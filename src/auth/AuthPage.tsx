import { useState } from 'react';
import { supabase } from '../core/supabaseClient';
import '../styles/auth.css';

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
        });
        if (err) throw err;
        if (data.user && data.session) {
           // Session created immediately
        } else if (data.user && !data.session) {
           setMessage('تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني لتأكيد التسجيل.');
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
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(null); setMessage(null); }}
            >
              تسجيل دخول
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
            >
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-input-group">
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
                minLength={6}
                required
              />
            </div>

            {error && <div className="auth-error-msg">{error}</div>}
            {message && <div className="auth-success-msg">{message}</div>}

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading ? 'جاري التنفيذ...' : (mode === 'login' ? 'دخول' : 'إنشاء حساب جديد')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
