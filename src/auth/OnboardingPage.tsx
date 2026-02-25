import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../core/supabaseClient';
import '../styles/auth.css'; // Will use shared styles but specific classes

interface OnboardingPageProps {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
  onFinish: (payload: { name: string; avatar_url: string | null; position: string | null }) => Promise<void>;
}

export default function OnboardingPage({
  userId,
  initialName,
  initialAvatarUrl,
  onFinish,
}: OnboardingPageProps) {
  const [name, setName] = useState(initialName);
  const [position, setPosition] = useState('');
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    if (picked.size > 2 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }
    setError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim()) {
      setError('الرجاء إدخال اسمك لنتمكن من التعرف عليك');
      return;
    }

    setIsSaving(true);
    let finalAvatarUrl = preview === null ? null : initialAvatarUrl;

    try {
      if (file) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${userId}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl + '?t=' + Date.now();
      }

      await onFinish({ 
        name: name.trim(), 
        avatar_url: finalAvatarUrl,
        position: position.trim() || null
      });
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات';
      setError(msg);
      setIsSaving(false); // Only stop saving if error, otherwise keep loading until unmount
    }
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-logo-wrap">
            <img src="/logo.jpg" alt="Logo" className="onboarding-logo" />
          </div>
          <h1 className="onboarding-title">مرحباً بك في الفريق! 👋</h1>
          <p className="onboarding-subtitle">لنقم بإعداد ملفك الشخصي لتظهر بشكل لائق أمام زملائك</p>
        </div>

        <form onSubmit={handleFinish} className="onboarding-form">
          
          {/* Avatar Selection */}
          <div className="onboarding-avatar-section">
            <button
              type="button"
              className="onboarding-avatar-btn"
              onClick={() => inputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Avatar" className="onboarding-avatar-img" />
              ) : (
                <div className="onboarding-avatar-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="onboarding-avatar-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <span className="onboarding-avatar-label">اختر صورة شخصية</span>
              {preview && (
                <button 
                  type="button" 
                  className="avatar-remove-btn"
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                  }}
                >
                  إزالة الصورة
                </button>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Form Fields */}
          <div className="onboarding-fields">
            <div className="form-group">
              <label className="field-label">الاسم الذي سيظهر للجميع</label>
              <input
                className="field-input big-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: محمد أحمد"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="field-label">المسمى الوظيفي (اختياري)</label>
              <input
                className="field-input big-input"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="مثال: مدير العمليات"
              />
            </div>
          </div>

          {error && <div className="onboarding-error">{error}</div>}

          <button type="submit" className="onboarding-submit-btn" disabled={isSaving}>
            {isSaving ? 'جاري الإعداد...' : 'حفظ ومتابعة ←'}
          </button>
        </form>
      </div>
    </div>
  );
}
