import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../core/supabaseClient';
import { cn } from '../lib/cn';

interface OnboardingPageProps {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
  onFinish: (payload: {
    name: string;
    avatar_url: string | null;
    position: string | null;
    phone: string | null;
  }) => Promise<void>;
}

export default function OnboardingPage({
  userId,
  initialName,
  initialAvatarUrl,
  onFinish,
}: OnboardingPageProps) {
  const [name, setName] = useState(initialName);
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
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
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl + '?t=' + Date.now();
      }

      await onFinish({
        name: name.trim(),
        avatar_url: finalAvatarUrl,
        position: position.trim() || null,
        phone: phone.trim() ? `+966${phone.trim()}` : null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات';
      setError(msg);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-[500px] rounded-[20px] border border-border bg-white p-10 text-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)]">
        <div className="mb-6">
          <div className="mx-auto mb-6 h-16 w-16 overflow-hidden rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="mb-2 text-2xl font-extrabold text-fg">أهلاً بك! 👋</h1>
          <p className="text-[15px] text-fg-secondary">لنقم بإكمال بيانات ملفك الشخصي</p>
        </div>

        <form onSubmit={handleFinish} className="text-right">
          <div className="mb-8 flex flex-col items-center gap-3">
            <button
              type="button"
              className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-page p-0 transition-all hover:border-primary hover:bg-primary-pale"
              onClick={() => inputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="absolute bottom-1.5 end-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
            <div className="flex flex-col items-center gap-2">
              <span className="cursor-pointer text-[13px] font-semibold text-primary">صورة شخصية (اختياري)</span>
              {preview && (
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-800 transition-colors hover:border-red-300 hover:bg-red-100"
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                  }}
                >
                  إزالة الصورة
                </button>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="mb-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-fg-secondary">الاسم الكامل</label>
              <input
                className={cn(
                  'rounded-lg border border-border bg-gray-50 px-4 py-3.5 font-sans text-base text-fg transition-all',
                  'focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_#e8f5ee] focus:outline-none',
                )}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: محمد أحمد"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-fg-secondary">المسمى الوظيفي (اختياري)</label>
              <input
                className={cn(
                  'rounded-lg border border-border bg-gray-50 px-4 py-3.5 font-sans text-base text-fg transition-all',
                  'focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_#e8f5ee] focus:outline-none',
                )}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="مثال: مدير العمليات"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-fg-secondary">رقم الجوال (اختياري)</label>
              <div className="flex items-center overflow-hidden rounded-lg border border-border-strong bg-white transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_#e8f5ee]">
                <div className="flex h-full items-center gap-1.5 border-s border-border bg-slate-50 px-3 text-sm font-semibold text-fg ltr:flex-row">
                  <img
                    src="https://flagcdn.com/w20/sa.png"
                    srcSet="https://flagcdn.com/w40/sa.png 2x"
                    width="20"
                    alt="Saudi Arabia"
                    className="rounded-sm"
                  />
                  <span dir="ltr">+966</span>
                </div>
                <input
                  type="tel"
                  className="flex-1 border-none bg-transparent px-3 py-3.5 font-sans text-base text-fg shadow-none outline-none ltr:text-left"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                  }}
                  placeholder="5xxxxxxxx"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {error && <div className="mb-5 rounded-lg bg-red-50 px-2.5 py-2.5 text-[13px] font-semibold text-red-500">{error}</div>}

          <button
            type="submit"
            className="w-full cursor-pointer rounded-xl border-none bg-primary py-3.5 font-sans text-base font-bold text-white shadow-[0_4px_12px_rgba(4,106,56,0.2)] transition-all hover:bg-primary-dark enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_8px_16px_rgba(4,106,56,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ ومتابعة ←'}
          </button>
        </form>
      </div>
    </div>
  );
}
