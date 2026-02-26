import { useDashboardData } from './store/useDashboardData';
import { useFilters } from './store/useFilters';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { KPICards } from './dashboard/KPICards';
import { SidebarFilters } from './dashboard/SidebarFilters';
import { ChartWrapper } from './charts/ChartWrapper';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { Histogram } from './charts/Histogram';
import { JourneyPage } from './journey/JourneyPage';
import AuthPage from './auth/AuthPage';
import { PendingApprovalPage } from './auth/PendingApprovalPage';
import OnboardingPage from './auth/OnboardingPage';
import ProfilePage from './auth/ProfilePage';
import { ApprovalsPage } from './admin/ApprovalsPage';
import { supabase } from './core/supabaseClient';
import { ensureUserAndApproval, type AppRole, type ApprovalStatus } from './core/authAccess';
import type { Filters } from './core/types';

type Page = 'dashboard' | 'journey' | 'approvals' | 'profile';
type ProfilePayload = {
  name: string;
  avatar_url: string | null;
  position: string | null;
  phone: string | null;
};

function ActiveFilterBadges() {
  const filters = useFilters((s) => s.filters);
  const toggle = useFilters((s) => s.toggleChartFilter);

  const chartKeys: (keyof Filters)[] = [
    'chart_gender',
    'chart_arrival_city',
    'chart_arrival_date',
    'chart_departure_date',
    'chart_arrival_hotel',
    'chart_departure_hotel',
    'chart_nationality',
    'chart_package',
    'chart_age_bucket',
  ];

  const labels: Record<string, string> = {
    chart_gender: 'الجنس',
    chart_arrival_city: 'مدينة الوصول',
    chart_arrival_date: 'تاريخ الوصول',
    chart_departure_date: 'تاريخ المغادرة',
    chart_arrival_hotel: 'فندق الوصول',
    chart_departure_hotel: 'فندق المغادرة',
    chart_nationality: 'الجنسية',
    chart_package: 'الباقة',
    chart_age_bucket: 'العمر',
  };

  const active = chartKeys.filter((k) => filters[k]);
  if (active.length === 0) return null;

  return (
    <div className="filter-badges">
      {active.map((k) => (
        <button key={k} className="filter-badge" onClick={() => toggle(k, filters[k]!)}>
          {labels[k]}: <strong>{filters[k]}</strong> x
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [page, setPage] = useState<Page>('dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || (role !== 'admin' && approvalStatus !== 'approved')) return;
    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [session, role, approvalStatus]);

  useEffect(() => {
    if (!session) {
      setRole(null);
      setApprovalStatus(null);
      setDisplayName('');
      setAvatarUrl(null);
      setPosition(null);
      setPhone(null);
      setNeedsOnboarding(false);
      setAccessLoading(false);
      return;
    }

    let cancelled = false;
    setAccessLoading(true);
    ensureUserAndApproval(session.user)
      .then(({ profile, approval }) => {
        if (cancelled) return;
        setRole(profile.role);
        setApprovalStatus(approval.status);
        setDisplayName(profile.name || session.user.email || 'مستخدم');
        setAvatarUrl(profile.avatar_url || null);
        setPosition(profile.position || null);
        setPhone(profile.phone || null);
        const shouldOnboard = profile.role !== 'admin' && profile.profile_completed !== true;
        setNeedsOnboarding(shouldOnboard);
      })
      .catch(() => {
        if (cancelled) return;
        setRole('user');
        setApprovalStatus('pending');
        setDisplayName(session.user.email || 'مستخدم');
        const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
        const fromMeta = typeof meta.avatar_url === 'string' ? meta.avatar_url : null;
        setAvatarUrl(fromMeta);
        setNeedsOnboarding(false);
      })
      .finally(() => {
        if (!cancelled) setAccessLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const {
    totalPilgrims,
    makkahRooms,
    madinahRooms,
    genderData,
    arrivalCityData,
    arrivalDateData,
    departureDateData,
    arrivalHotelData,
    departureHotelData,
    nationalityData,
    packageData,
    ageData,
  } = useDashboardData();

  const toggleChart = useFilters((s) => s.toggleChartFilter);
  const clearAll = useFilters((s) => s.clearAllFilters);
  const filters = useFilters((s) => s.filters);

  const hasAnyFilter = Object.values(filters).some(Boolean);
  const userEmail = session?.user?.email ?? 'user';
  const isAdmin = role === 'admin';
  const isApproved = isAdmin || approvalStatus === 'approved';
  const saveProfile = async (payload: ProfilePayload, options?: { markProfileCompleted?: boolean }) => {
    if (!session) return;
    const { error } = await supabase
      .schema('publicsv')
      .from('users')
      .update({
        name: payload.name,
        avatar_url: payload.avatar_url,
        position: payload.position,
        phone: payload.phone,
        ...(options?.markProfileCompleted ? { profile_completed: true } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);
    if (error) throw error;
    setDisplayName(payload.name);
    setAvatarUrl(payload.avatar_url);
    setPosition(payload.position);
    setPhone(payload.phone);
  };

  if (authLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card auth-loading">جاري تحميل الجلسة...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  // New User Onboarding Flow
  if (needsOnboarding && !accessLoading) {
    return (
      <OnboardingPage
        userId={session.user.id}
        initialName={displayName || userEmail}
        initialAvatarUrl={avatarUrl}
        onFinish={async (payload) => {
          await saveProfile(payload, { markProfileCompleted: true });
          setNeedsOnboarding(false);
          setShowIntro(true); // Show welcome intro after onboarding
        }}
      />
    );
  }

  if (!isApproved && !accessLoading) {
    return <PendingApprovalPage userName={displayName || userEmail} />;
  }

  if (showIntro) {
    return (
      <div className="intro-overlay">
        <div className="intro-card">
          <div className="intro-logo-wrap">
            <img src="/logo.jpg" alt="Logo" className="intro-logo" />
          </div>
          <h2 className="intro-title">لوحة المعلومات التنفيذية</h2>
          <p className="intro-subtitle">مرحبًا بكم في منصة تحليلات بيانات الحجاج</p>
          <div className="intro-progress">
            <span className="intro-progress-bar" />
          </div>
        </div>
      </div>
    );
  }

  const isDashboard = page === 'dashboard';
  const isJourney   = page === 'journey';
  const isApprovals = page === 'approvals';

  return (
    <div className="app-shell">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="top-header">
        <div className="header-left">
          <div className="header-brand">
            <div className="header-logo-wrap">
              <img src="/logo.jpg" alt="Logo" className="header-logo-img" />
            </div>
            {isDashboard && (
              <div className="header-texts">
                <h1 className="header-title">لوحة المعلومات التنفيذية</h1>
                <div className="header-sub-row">
                  <span className="header-subtitle">تحليلات بيانات الحجاج</span>
                  <span className="header-date">
                    {new Date().toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <nav className="header-nav">
          <button
            className={`header-nav-tab${isDashboard ? ' active' : ''}`}
            onClick={() => setPage('dashboard')}
          >
            لوحة المعلومات
          </button>
          <button
            className={`header-nav-tab${isJourney ? ' active' : ''}`}
            onClick={() => setPage('journey')}
          >
            مسار الرحلة
          </button>
          {isAdmin && (
            <button
              className={`header-nav-tab${isApprovals ? ' active' : ''}`}
              onClick={() => setPage('approvals')}
            >
              الموافقات
            </button>
          )}
        </nav>
        <div className="header-right">
          <button
            type="button"
            className="header-user-chip"
            title="تعديل الملف الشخصي"
            onClick={() => setPage('profile')}
          >
            <span className="header-user-name">{displayName || userEmail}</span>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName || 'User'} className="header-user-avatar" />
            ) : (
              <span className="header-user-avatar fallback" aria-label="User avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            )}
          </button>
          <button className="icon-action-btn" onClick={() => supabase.auth.signOut()} title="تسجيل الخروج" aria-label="تسجيل الخروج">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 7l5 5-5 5M20 12H9M12 4H6a2 2 0 00-2 2v12a2 2 0 002 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {isDashboard && (
            <>
              {hasAnyFilter && (
                <button className="clear-all-btn" onClick={clearAll}>
                  مسح جميع الفلاتر
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {page === 'profile' && session && (
        <ProfilePage
          userId={session.user.id}
          initialName={displayName || userEmail}
          initialAvatarUrl={avatarUrl}
          initialPosition={position}
          initialPhone={phone}
          onBack={() => setPage('dashboard')}
          onSave={saveProfile}
        />
      )}

      {isJourney && <JourneyPage />}
      {isApprovals && isAdmin && <ApprovalsPage adminUserId={session.user.id} />}

      {isDashboard && <div className="main-layout">
        {/* ── Sidebar ──────────────────────────────────────────── */}
        <SidebarFilters />

        {/* ── Content ──────────────────────────────────────────── */}
        <main className="content-area">
          {/* KPI Cards */}
          <KPICards
            totalPilgrims={totalPilgrims}
            makkahRooms={makkahRooms}
            madinahRooms={madinahRooms}
          />

          {/* Active cross-filter badges */}
          <ActiveFilterBadges />

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Row 1: Pie + Arrival City */}
            <div className="chart-span-1">
              <ChartWrapper title="توزيع الحجاج حسب الجنس" height={280}>
                <PieChart
                  data={genderData}
                  onSegmentClick={(v) => toggleChart('chart_gender', v)}
                />
              </ChartWrapper>
            </div>

            <div className="chart-span-2">
              <ChartWrapper title="عدد الحجاج حسب مدينة الوصول" height={280}>
                <BarChart
                  data={arrivalCityData}
                  onSegmentClick={(v) => toggleChart('chart_arrival_city', v)}
                  layout="vertical"
                />
              </ChartWrapper>
            </div>

            {/* Row 2: Arrival Date */}
            <div className="chart-span-3">
              <ChartWrapper title="عدد الحجاج حسب تاريخ الوصول" height={240}>
                <BarChart
                  data={arrivalDateData}
                  onSegmentClick={(v) => toggleChart('chart_arrival_date', v)}
                  maxLabelLen={10}
                />
              </ChartWrapper>
            </div>

            {/* Row 3: Departure Date */}
            <div className="chart-span-3">
              <ChartWrapper title="عدد الحجاج حسب تاريخ المغادرة" height={240}>
                <BarChart
                  data={departureDateData}
                  onSegmentClick={(v) => toggleChart('chart_departure_date', v)}
                  maxLabelLen={10}
                />
              </ChartWrapper>
            </div>

            {/* Row 4: Arrival Hotel + Departure Hotel */}
            <div className="chart-span-2">
              <ChartWrapper title="عدد الحجاج حسب فندق الوصول" height={260}>
                <BarChart
                  data={arrivalHotelData}
                  onSegmentClick={(v) => toggleChart('chart_arrival_hotel', v)}
                  layout="vertical"
                  maxLabelLen={18}
                />
              </ChartWrapper>
            </div>

            <div className="chart-span-2">
              <ChartWrapper title="عدد الحجاج حسب فندق المغادرة" height={260}>
                <BarChart
                  data={departureHotelData}
                  onSegmentClick={(v) => toggleChart('chart_departure_hotel', v)}
                  layout="vertical"
                  maxLabelLen={18}
                />
              </ChartWrapper>
            </div>

            {/* Row 5: Nationality */}
            <div className="chart-span-3">
              <ChartWrapper title="عدد الحجاج حسب الجنسية" height={250}>
                <BarChart
                  data={nationalityData}
                  onSegmentClick={(v) => { if (v !== 'أخرى') toggleChart('chart_nationality', v); }}
                  layout="vertical"
                  maxLabelLen={14}
                />
              </ChartWrapper>
            </div>

            {/* Row 6: Package Name */}
            <div className="chart-span-3">
              <ChartWrapper title="عدد الحجاج حسب الباقة" height={270}>
                <BarChart
                  data={packageData}
                  onSegmentClick={(v) => toggleChart('chart_package', v)}
                  maxLabelLen={12}
                />
              </ChartWrapper>
            </div>

            {/* Row 7: Age Histogram */}
            <div className="chart-span-3">
              <ChartWrapper title="التوزيع العمري" height={260}>
                <Histogram
                  data={ageData}
                  onSegmentClick={(v) => toggleChart('chart_age_bucket', v)}
                />
              </ChartWrapper>
            </div>
          </div>
        </main>
      </div>}
    </div>
  );
}
