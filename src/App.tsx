import { useDashboardData } from './store/useDashboardData';
import { useFilters } from './store/useFilters';
import { usePilgrimsData } from './store/usePilgrimsData';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { KPICards } from './dashboard/KPICards';
import { PilgrimsTable } from './dashboard/PilgrimsTable';
import { HolyCityPresenceChart } from './dashboard/HolyCityPresenceChart';
import { SidebarFilters } from './dashboard/SidebarFilters';
import { ChartWrapper } from './charts/ChartWrapper';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { Histogram } from './charts/Histogram';
import { JourneyPage } from './journey/JourneyPage';
import { ReportsPage } from './reports/ReportsPage';
import AuthPage from './auth/AuthPage';
import { PendingApprovalPage } from './auth/PendingApprovalPage';
import OnboardingPage from './auth/OnboardingPage';
import ProfilePage from './auth/ProfilePage';
import { ApprovalsPage } from './admin/ApprovalsPage';
import { supabase } from './core/supabaseClient';
import {
  clearDashboardEmbedSessionFlag,
  isDashboardEmbedPresentation,
} from './core/embedPresentation';
import { ensureUserAndApproval, type AppRole, type ApprovalStatus } from './core/authAccess';
import type { Filters } from './core/types';
import { FullScreenLoader } from './components/FullScreenLoader';
import { AirportBadge } from './components/RegionBadge';
import { cn } from './lib/cn';
import { formatPresenceBucketDdMm } from './core/pilgrimDailyPresence';
import { HiArrowRightOnRectangle, HiUser } from 'react-icons/hi2';

type Page = 'dashboard' | 'journey' | 'approvals' | 'profile' | 'reports';
type ProfilePayload = {
  name: string;
  avatar_url: string | null;
  position: string | null;
  phone: string | null;
};

function ActiveFilterBadges() {
  const filters = useFilters((s) => s.filters);
  const toggle = useFilters((s) => s.toggleChartFilter);
  const clearHolyCityPresence = useFilters((s) => s.clearHolyCityPresenceFilter);

  const chartKeys: (keyof Filters)[] = [
    'table_inside_kingdom',
    'chart_gender',
    'chart_arrival_city',
    'chart_contract_type',
    'chart_visa_status',
    'chart_arrival_date',
    'chart_departure_date',
    'chart_arrival_hotel',
    'chart_departure_hotel',
    'chart_third_stop',
    'chart_nationality',
    'chart_package',
    'chart_package_type',
    'chart_age_bucket',
    'chart_holy_city',
  ];

  const labels: Record<string, string> = {
    table_inside_kingdom: 'حالة التواجد',
    chart_gender: 'الجنس',
    chart_arrival_city: 'مطار مدينة الوصول',
    chart_contract_type: 'عقد الطيران',
    chart_visa_status: 'حالة التأشيرة',
    chart_arrival_date: 'تاريخ الوصول',
    chart_departure_date: 'تاريخ المغادرة',
    chart_arrival_hotel: 'التوقف 1',
    chart_departure_hotel: 'التوقف 2',
    chart_third_stop: 'التوقف 3',
    chart_nationality: 'الجنسية',
    chart_package: 'الباقة',
    chart_package_type: 'نوع الباقة',
    chart_age_bucket: 'العمر',
    chart_holy_city: 'التواجد (مكة / المدينة)',
  };

  const active = chartKeys.filter((k) => filters[k]);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {active.map((k) => (
        <button
          key={k}
          type="button"
          className="cursor-pointer rounded-full border border-[#b3d9c5] bg-primary-pale px-3 py-1 text-xs font-medium text-primary-dark transition-all duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
          onClick={() => {
            if (k === 'chart_holy_city') clearHolyCityPresence();
            else toggle(k, filters[k]!);
          }}
        >
          {labels[k]}:{' '}
          {k === 'chart_arrival_city' ? (
            <AirportBadge code={String(filters[k])} />
          ) : k === 'chart_holy_city' ? (
            <>
              <strong>{String(filters.chart_holy_city)}</strong>
              {filters.chart_holy_city_date ? (
                <>
                  {' '}
                  ·{' '}
                  <span className="tabular-nums" dir="ltr">
                    {formatPresenceBucketDdMm({
                      start: filters.chart_holy_city_date,
                      end: filters.chart_holy_city_date_end ?? filters.chart_holy_city_date,
                    })}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <strong>{String(filters[k])}</strong>
          )}{' '}
          x
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [isEmbedPresentation] = useState(() => isDashboardEmbedPresentation());
  const [showIntro, setShowIntro] = useState(() => !isDashboardEmbedPresentation());
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
    if (isEmbedPresentation) {
      setShowIntro(false);
      return;
    }
    if (!session || (role !== 'admin' && approvalStatus !== 'approved')) return;
    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [session, role, approvalStatus, isEmbedPresentation]);

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
    filteredData,
    totalPilgrims,
    makkahRooms,
    madinahRooms,
    contractData,
    visaStatusData,
    genderData,
    arrivalCityData,
    arrivalDateData,
    departureDateData,
    arrivalHotelData,
    departureHotelData,
    thirdStopData,
    nationalityData,
    packageData,
    packageTypeData,
    ageData,
  } = useDashboardData();

  const toggleChart = useFilters((s) => s.toggleChartFilter);
  const setSidebarFilter = useFilters((s) => s.setSidebarFilter);
  const clearAll = useFilters((s) => s.clearAllFilters);
  const filters = useFilters((s) => s.filters);

  const hasAnyFilter = Object.values(filters).some(Boolean);
  const userEmail = session?.user?.email ?? 'user';
  const isAdmin = role === 'admin';
  const canOpenApprovals = isAdmin;
  const isApproved = isAdmin || approvalStatus === 'approved';
  const fetchPilgrimsData = usePilgrimsData((s) => s.fetchData);

  useEffect(() => {
    if (page === 'approvals' && !isAdmin) {
      setPage('dashboard');
    }
  }, [page, isAdmin]);

  useEffect(() => {
    if (!session || !isApproved) return;
    fetchPilgrimsData();
  }, [session, isApproved, fetchPilgrimsData]);

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
    return <FullScreenLoader variant="loading" />;
  }

  if (!session) {
    return <AuthPage />;
  }

  const accessPending =
    accessLoading || (role === null && approvalStatus === null);
  if (accessPending) {
    return <FullScreenLoader variant="loading" />;
  }

  if (needsOnboarding && !accessLoading) {
    return (
      <OnboardingPage
        userId={session.user.id}
        initialName={displayName || userEmail}
        initialAvatarUrl={avatarUrl}
        onFinish={async (payload) => {
          await saveProfile(payload, { markProfileCompleted: true });
          setNeedsOnboarding(false);
          if (!isEmbedPresentation) setShowIntro(true);
        }}
      />
    );
  }

  if (!isApproved && !accessLoading) {
    return <PendingApprovalPage userName={displayName || userEmail} />;
  }

  if (showIntro && !isEmbedPresentation) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center animate-[intro-fade_0.45s_ease] bg-[radial-gradient(circle_at_20%_20%,rgba(4,106,56,0.2),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(4,106,56,0.18),transparent_45%),#f1f5f9]"
      >
        <div className="flex min-w-[360px] max-w-[520px] flex-col items-center gap-3 rounded-2xl border border-border bg-white px-7 pb-5 pt-6 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
          <div className="rounded-xl border border-border bg-gray-100 px-3 py-2">
            <img src="/logo.jpg" alt="Logo" className="block h-[62px] w-auto rounded-[10px]" />
          </div>
          <h2 className="text-[26px] font-extrabold tracking-tight text-primary">لوحة المعلومات التنفيذية</h2>
          <p className="text-sm font-medium text-fg-secondary">مرحبًا بكم في منصة تحليلات بيانات الحجاج</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <span className="block h-full w-0 animate-[intro-load_3s_linear_forwards] bg-gradient-to-r from-primary to-emerald-600" />
          </div>
        </div>
      </div>
    );
  }

  const isDashboard = page === 'dashboard';
  const isJourney = page === 'journey';
  const isApprovals = page === 'approvals';
  const isReports = page === 'reports';

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="relative z-10 flex h-[78px] shrink-0 items-center justify-between bg-primary px-[22px] shadow-[0_4px_14px_rgba(4,106,56,0.22)] max-md:h-[70px] max-md:px-4">
        <div className="flex items-center">
          <div className="flex items-center gap-3">
            <div className="flex min-h-[58px] min-w-[78px] items-center justify-center rounded-xl bg-gray-100 px-2.5 py-1.5 shadow-[0_1px_4px_rgba(15,23,42,0.15)] max-md:min-h-[50px] max-md:min-w-[66px] max-md:p-2">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="h-[46px] w-auto max-w-none rounded-lg object-contain max-md:h-[38px]"
              />
            </div>
            {(isDashboard || isReports) && (
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-white max-md:text-xl max-[768px]:text-lg">
                  {isReports ? 'التقارير' : 'لوحة المعلومات التنفيذية'}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="hidden w-fit rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-medium tracking-wide text-white/90 lg:inline">
                    {isReports ? 'تقارير أنواع الباقات والبيانات' : 'تحليلات بيانات الحجاج'}
                  </span>
                  <span className="hidden whitespace-nowrap rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-white md:inline">
                    {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-1 rounded-[10px] bg-black/15 p-1">
          <button
            type="button"
            className={cn(
              'rounded-[7px] border-none bg-transparent px-[18px] py-1.5 font-sans text-[13px] font-semibold whitespace-nowrap text-white/70 transition-all duration-[180ms] ease-out',
              'hover:bg-white/12 hover:text-white',
              isDashboard && 'bg-white text-primary-dark shadow-[0_1px_4px_rgba(0,0,0,0.15)]',
            )}
            onClick={() => setPage('dashboard')}
          >
            لوحة المعلومات
          </button>
          <button
            type="button"
            className={cn(
              'rounded-[7px] border-none bg-transparent px-[18px] py-1.5 font-sans text-[13px] font-semibold whitespace-nowrap text-white/70 transition-all duration-[180ms] ease-out',
              'hover:bg-white/12 hover:text-white',
              isJourney && 'bg-white text-primary-dark shadow-[0_1px_4px_rgba(0,0,0,0.15)]',
            )}
            onClick={() => setPage('journey')}
          >
            مسار الرحلة
          </button>
          <button
            type="button"
            className={cn(
              'rounded-[7px] border-none bg-transparent px-[18px] py-1.5 font-sans text-[13px] font-semibold whitespace-nowrap text-white/70 transition-all duration-[180ms] ease-out',
              'hover:bg-white/12 hover:text-white',
              isReports && 'bg-white text-primary-dark shadow-[0_1px_4px_rgba(0,0,0,0.15)]',
            )}
            onClick={() => setPage('reports')}
          >
            التقارير
          </button>
          {canOpenApprovals && (
            <button
              type="button"
              className={cn(
                'rounded-[7px] border-none bg-transparent px-[18px] py-1.5 font-sans text-[13px] font-semibold whitespace-nowrap text-white/70 transition-all duration-[180ms] ease-out',
                'hover:bg-white/12 hover:text-white',
                isApprovals && 'bg-white text-primary-dark shadow-[0_1px_4px_rgba(0,0,0,0.15)]',
              )}
              onClick={() => setPage('approvals')}
            >
              الموافقات
            </button>
          )}
        </nav>
        <div className="flex items-center gap-2.5">
          {!isEmbedPresentation && (
            <>
              <button
                type="button"
                className="inline-flex max-w-[220px] cursor-pointer items-center gap-2 rounded-full border border-white/30 bg-white/15 py-0.5 ps-1 pe-2 transition-all duration-150 ease-out hover:border-white/50 hover:bg-white/25 max-[768px]:p-0.5"
                title="تعديل الملف الشخصي"
                onClick={() => setPage('profile')}
              >
                <span className="truncate text-xs font-semibold text-white max-[768px]:hidden">
                  {displayName || userEmail}
                </span>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || 'User'}
                    className="h-7 w-7 shrink-0 rounded-full border border-white/50 object-cover"
                  />
                ) : (
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/25 font-bold text-white"
                    aria-label="User avatar"
                  >
                    <HiUser className="h-4 w-4" aria-hidden />
                  </span>
                )}
              </button>
              <button
                type="button"
                className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg border border-white/35 bg-white/15 text-white transition-all duration-150 ease-out hover:border-white/50 hover:bg-white/25"
                onClick={() => {
                  clearDashboardEmbedSessionFlag();
                  void supabase.auth.signOut();
                }}
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
              </button>
            </>
          )}
          {isDashboard && hasAnyFilter && (
            <button
              type="button"
              className="cursor-pointer whitespace-nowrap rounded-lg border border-white bg-white px-3.5 py-1.5 font-sans text-xs font-bold text-primary-dark shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-all duration-150 ease-out hover:border-gray-100 hover:bg-gray-100"
              onClick={clearAll}
            >
              مسح جميع الفلاتر
            </button>
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
      {isApprovals && canOpenApprovals && <ApprovalsPage adminUserId={session.user.id} />}
      {isReports && <ReportsPage />}

      {isDashboard && (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <SidebarFilters />

          <main className="scrollbar-content flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-page px-[22px] pb-7 pt-[18px]">
            <KPICards
              totalPilgrims={totalPilgrims}
              makkahRooms={makkahRooms}
              madinahRooms={madinahRooms}
            />

            <ActiveFilterBadges />

            <div className="grid grid-cols-4 gap-[14px] max-xl:grid-cols-2 max-md:grid-cols-1">
              <div className="col-span-1 max-md:col-span-1">
                <ChartWrapper title="توزيع الحجاج حسب الجنس" height={280}>
                  <PieChart data={genderData} onSegmentClick={(v) => toggleChart('chart_gender', v)} />
                </ChartWrapper>
              </div>

              <div className="col-span-2 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب مدينة الوصول" height={280}>
                  <BarChart
                    data={arrivalCityData}
                    categoryKey="axisLabel"
                    onSegmentClick={(v) => toggleChart('chart_arrival_city', v)}
                    layout="vertical"
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-1 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب عقد الطيران" height={280}>
                  <BarChart
                    data={contractData}
                    onSegmentClick={(v) => toggleChart('chart_contract_type', v)}
                    layout="vertical"
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-4 max-xl:col-span-2 max-md:col-span-1">
                <HolyCityPresenceChart filteredData={filteredData} />
              </div>

              <div className="col-span-4 max-xl:col-span-2 max-md:col-span-1">
                <PilgrimsTable
                  data={filteredData}
                  searchValue={filters.table_search ?? ''}
                  insideFilterValue={filters.table_inside_kingdom ?? 'all'}
                  onSearchChange={(value) => setSidebarFilter('table_search', value.trim() ? value : null)}
                  onInsideFilterChange={(value) =>
                    setSidebarFilter('table_inside_kingdom', value === 'all' ? null : value)
                  }
                />
              </div>

              <div className="col-span-2 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب تاريخ الوصول" height={240}>
                  <BarChart
                    data={arrivalDateData}
                    onSegmentClick={(v) => toggleChart('chart_arrival_date', v)}
                    maxLabelLen={10}
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-2 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب تاريخ المغادرة" height={240}>
                  <BarChart
                    data={departureDateData}
                    onSegmentClick={(v) => toggleChart('chart_departure_date', v)}
                    maxLabelLen={10}
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-2 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب التوقف الأول" height={260}>
                  <BarChart
                    data={arrivalHotelData}
                    onSegmentClick={(v) => toggleChart('chart_arrival_hotel', v)}
                    layout="vertical"
                    maxLabelLen={18}
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-2 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب التوقف الثاني" height={260}>
                  <BarChart
                    data={departureHotelData}
                    onSegmentClick={(v) => toggleChart('chart_departure_hotel', v)}
                    layout="vertical"
                    maxLabelLen={18}
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-2 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب التوقف الثالث" height={260}>
                  <BarChart
                    data={thirdStopData}
                    onSegmentClick={(v) => toggleChart('chart_third_stop', v)}
                    layout="vertical"
                    maxLabelLen={18}
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-4 max-xl:col-span-2 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب الجنسية" height={250}>
                  <BarChart
                    data={nationalityData}
                    onSegmentClick={(v) => {
                      if (v !== 'أخرى') toggleChart('chart_nationality', v);
                    }}
                    layout="vertical"
                    maxLabelLen={14}
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-4 max-xl:col-span-2 max-md:col-span-1">
                <ChartWrapper title="حالة الحجاج حسب التأشيرة" height={260}>
                  <BarChart
                    data={visaStatusData}
                    onSegmentClick={(v) => toggleChart('chart_visa_status', v)}
                    layout="vertical"
                  />
                </ChartWrapper>
              </div>

              <div className="col-span-4 max-xl:col-span-2 max-md:col-span-1">
                <ChartWrapper title="عدد الحجاج حسب الباقة" height={520}>
                  <div className="flex h-full flex-col gap-3">
                    <div className="flex min-h-0 flex-1 flex-col gap-1">
                      <p className="shrink-0 text-[10px] font-bold tracking-wide text-fg-secondary uppercase">
                        حسب اسم الباقة
                      </p>
                      <div className="min-h-0 flex-1">
                        <BarChart
                          data={packageData}
                          onSegmentClick={(v) => toggleChart('chart_package', v)}
                          maxLabelLen={12}
                        />
                      </div>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-1 border-t border-gray-100 pt-2">
                      <p className="shrink-0 text-[10px] font-bold tracking-wide text-fg-secondary uppercase">
                        حسب نوع الباقة (T1–T5)
                      </p>
                      <div className="min-h-0 flex-1">
                        {packageTypeData.length === 0 ? (
                          <p className="flex h-full items-center justify-center px-2 text-center text-xs text-fg-secondary">
                            لا توجد بيانات لأنواع الباقات (T1–T5) في النتائج الحالية.
                          </p>
                        ) : (
                          <BarChart
                            data={packageTypeData}
                            onSegmentClick={(v) => toggleChart('chart_package_type', v)}
                            maxLabelLen={8}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </ChartWrapper>
              </div>

              <div className="col-span-4 max-xl:col-span-2 max-md:col-span-1">
                <ChartWrapper title="التوزيع العمري" height={260}>
                  <Histogram data={ageData} onSegmentClick={(v) => toggleChart('chart_age_bucket', v)} />
                </ChartWrapper>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
