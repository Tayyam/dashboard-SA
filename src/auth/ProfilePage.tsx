import { useRef, useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { supabase } from '../core/supabaseClient';
import { cn } from '../lib/cn';

interface ProfilePageProps {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
  initialPosition: string | null;
  initialPhone: string | null;
  onBack: () => void;
  onSave: (payload: {
    name: string;
    avatar_url: string | null;
    position: string | null;
    phone: string | null;
  }) => Promise<void>;
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
      if (file) {
        setUploadProgress('جاري رفع الصورة...');
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${userId}.${ext}`;

        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);

        finalAvatarUrl = urlData.publicUrl + '?t=' + Date.now();
        setUploadProgress(null);
      }

      if (newPassword) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword });
        if (pwdErr) throw pwdErr;
      }

      await onSave({
        name: name.trim(),
        avatar_url: finalAvatarUrl,
        position: position.trim() || null,
        phone: phone.trim() ? `+966${phone.trim()}` : null,
      });

      setMessage('تم حفظ التعديلات بنجاح');
      setFile(null);
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

  const fieldClass =
    'rounded-lg border border-border bg-gray-50 px-3.5 py-2.5 font-sans text-sm text-fg transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_#e8f5ee] focus:outline-none';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-page">
      <div className="flex items-center gap-5 border-b border-border bg-white px-8 py-6">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-[13px] font-semibold text-fg-secondary transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-fg"
          onClick={onBack}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          العودة
        </button>
        <h2 className="text-[22px] font-bold text-fg">الملف الشخصي</h2>
      </div>

      <div className="flex flex-1 justify-center overflow-y-auto p-8 max-md:p-6">
        <form
          className="h-fit w-full max-w-[900px] rounded-2xl border border-border bg-white p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-md:p-6"
          onSubmit={handleSave}
        >
          <div className="grid grid-cols-[280px_1fr] gap-12 max-lg:grid-cols-1 max-lg:gap-8">
            <div className="flex flex-col items-center max-lg:border-b max-lg:border-gray-100 max-lg:pb-6">
              <div className="flex flex-col items-center gap-5 text-center">
                <button
                  type="button"
                  className="relative h-40 w-40 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-gray-100 p-0 shadow-[0_0_0_2px_var(--color-primary),0_8px_24px_rgba(4,106,56,0.15)]"
                  onClick={() => inputRef.current?.click()}
                  title="اضغط لتغيير الصورة"
                >
                  {preview ? (
                    <img src={preview} alt="avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/60 opacity-0 transition-opacity hover:opacity-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>
                <div>
                  <h3 className="mb-1.5 text-base font-bold text-fg">صورة الملف الشخصي</h3>
                  <p className="text-[13px] leading-snug text-fg-muted">تغيير الصورة الشخصية التي تظهر في النظام</p>
                  {preview && (
                    <button
                      type="button"
                      className="mt-3 cursor-pointer rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition-colors hover:border-red-300 hover:bg-red-100"
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
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h3 className="mb-2 flex items-center gap-3 text-[15px] font-bold text-primary after:h-px after:flex-1 after:bg-gray-200 after:content-['']">
                  المعلومات الأساسية
                </h3>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-fg-secondary">الاسم الكامل</label>
                  <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسمك الكامل" required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-fg-secondary">المنصب (اختياري)</label>
                  <input
                    className={fieldClass}
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="مثال: مدير المشروع، محلل بيانات..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-fg-secondary">رقم الجوال (اختياري)</label>
                  <div className="flex items-center overflow-hidden rounded-lg border border-border-strong bg-white focus-within:border-primary focus-within:shadow-[0_0_0_3px_#e8f5ee]">
                    <div className="flex items-center gap-1.5 border-s border-border bg-slate-50 px-3 py-2.5 text-sm font-semibold ltr:flex-row">
                      <img src="https://flagcdn.com/w20/sa.png" width="20" alt="SA" />
                      <span dir="ltr">+966</span>
                    </div>
                    <input
                      className={cn(fieldClass, 'flex-1 rounded-none border-0 bg-transparent shadow-none')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="5xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="mb-2 flex items-center gap-3 text-[15px] font-bold text-primary after:h-px after:flex-1 after:bg-gray-200 after:content-['']">
                  الأمان وتغيير كلمة السر
                </h3>

                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-semibold text-fg-secondary">كلمة السر الجديدة</label>
                    <input
                      type="password"
                      className={fieldClass}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-semibold text-fg-secondary">تأكيد كلمة السر</label>
                    <input
                      type="password"
                      className={fieldClass}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <p className="-mt-2 text-xs text-fg-muted">اترك الحقول فارغة إذا كنت لا ترغب في تغيير كلمة السر</p>
              </div>

              {uploadProgress && (
                <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] font-semibold text-blue-900">{uploadProgress}</p>
              )}
              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-800">{error}</p>}
              {message && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800">{message}</p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  className="cursor-pointer rounded-lg border border-border bg-white px-6 py-2.5 text-sm font-semibold text-fg-secondary transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50"
                  onClick={onBack}
                  disabled={isSaving}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-lg border-none bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:-translate-y-px disabled:opacity-50"
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
