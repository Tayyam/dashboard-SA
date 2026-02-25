import { useRef, useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { supabase } from '../core/supabaseClient';

interface ProfilePageProps {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
  initialPosition: string | null;
  initialPhone: string | null;
  onBack: () => void;
  onSave: (payload: { name: string; avatar_url: string | null; position: string | null; phone: string | null }) => Promise<void>;
}

export default function ProfilePage({
  userId,
  initialName,
  initialAvatarUrl,
  initialPosition,
  initialPhone,
  onBack,
  onSave,
}: ProfilePageProps) {
  const [name, setName] = useState(initialName);
  const [position, setPosition] = useState(initialPosition || '');
  const [phone, setPhone] = useState(initialPhone?.replace('+966', '') || '');
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset states if props change (though unlikely in this flow)
    setName(initialName);
    setPosition(initialPosition || '');
    setPhone(initialPhone?.replace('+966', '') || '');
    setPreview(initialAvatarUrl);
  }, [initialName, initialPosition, initialAvatarUrl, initialPhone]);

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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!name.trim()) {
      setError('الاسم مطلوب');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('كلمات السر غير متطابقة');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('كلمة السر يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsSaving(true);
    let finalAvatarUrl = preview === null ? null : initialAvatarUrl;

    try {
      // 1. Upload Avatar if changed
      if (file) {
        setUploadProgress('جاري رفع الصورة...');
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
        setUploadProgress(null);
      }

      // 2. Update Password if provided
      if (newPassword) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword });
        if (pwdErr) throw pwdErr;
      }

      // 3. Update Profile Name, Avatar, Position and Phone
      await onSave({ 
        name: name.trim(), 
        avatar_url: finalAvatarUrl,
        position: position.trim() || null,
        phone: phone.trim() ? `+966${phone.trim()}` : null
      });
      
      setMessage('تم حفظ التعديلات بنجاح');
      setFile(null); // Clear file state after successful save
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر حفظ البيانات';
      setError(msg);
      setUploadProgress(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <button className="profile-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          العودة
        </button>
        <h2 className="profile-page-title">الملف الشخصي</h2>
      </div>

      <div className="profile-page-container">
        <form className="profile-form-card" onSubmit={handleSave}>
          <div className="profile-form-layout">
            
            {/* Left side: Avatar picker */}
            <div className="profile-avatar-section">
              <div className="avatar-picker-large">
                <button
                  type="button"
                  className="avatar-circle-big"
                  onClick={() => inputRef.current?.click()}
                  title="اضغط لتغيير الصورة"
                >
                  {preview ? (
                    <img src={preview} alt="avatar preview" className="avatar-img-big" />
                  ) : (
                    <div className="avatar-placeholder-big">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                  <div className="avatar-overlay-big">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </div>
                </button>
                <div className="avatar-hint-big">
                  <h3>صورة الملف الشخصي</h3>
                  <p>تغيير الصورة الشخصية التي تظهر في النظام</p>
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
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {/* Right side: Form fields */}
            <div className="profile-fields-section">
              <div className="profile-section-block">
                <h3 className="section-title-line">المعلومات الأساسية</h3>
                
                <div className="form-group">
                  <label className="field-label">الاسم الكامل</label>
                  <input
                    className="field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">المنصب (اختياري)</label>
                  <input
                    className="field-input"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="مثال: مدير المشروع، محلل بيانات..."
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">رقم الجوال (اختياري)</label>
                  <div className="phone-input-wrap">
                    <div className="phone-prefix">
                      <img src="https://flagcdn.com/w20/sa.png" width="20" alt="SA" />
                      <span dir="ltr">+966</span>
                    </div>
                    <input
                      className="field-input phone-field"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="5xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="profile-section-block">
                <h3 className="section-title-line">الأمان وتغيير كلمة السر</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="field-label">كلمة السر الجديدة</label>
                    <input
                      type="password"
                      className="field-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">تأكيد كلمة السر</label>
                    <input
                      type="password"
                      className="field-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <p className="field-hint">اترك الحقول فارغة إذا كنت لا ترغب في تغيير كلمة السر</p>
              </div>

              {uploadProgress && <p className="status-msg progress">{uploadProgress}</p>}
              {error && <p className="status-msg error">{error}</p>}
              {message && <p className="status-msg success">{message}</p>}

              <div className="profile-form-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onBack}
                  disabled={isSaving}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ كافة التغييرات'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
