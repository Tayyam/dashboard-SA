import { useDashboardData } from './store/useDashboardData';
import { useFilters } from './store/useFilters';
import { useEffect, useState } from 'react';
import { KPICards } from './dashboard/KPICards';
import { SidebarFilters } from './dashboard/SidebarFilters';
import { ChartWrapper } from './charts/ChartWrapper';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { Histogram } from './charts/Histogram';
import { exportPilgrimsToExcel } from './core/exportExcel';
import { JourneyPage } from './journey/JourneyPage';
import type { Filters } from './core/types';

type Page = 'dashboard' | 'journey';

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
    'chart_accommodation_status',
    'chart_package',
    'chart_company',
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
    chart_accommodation_status: 'حالة السكن',
    chart_package: 'الباقة',
    chart_company: 'الشركة',
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const {
    filteredData,
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
    accommodationStatusData,
    packageData,
    companyData,
    ageData,
  } = useDashboardData();

  const toggleChart = useFilters((s) => s.toggleChartFilter);
  const clearAll = useFilters((s) => s.clearAllFilters);
  const filters = useFilters((s) => s.filters);

  const hasAnyFilter = Object.values(filters).some(Boolean);

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
                <span className="header-subtitle">تحليلات بيانات الحجاج</span>
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
        </nav>
        <div className="header-right">
          <span className="header-date">
            {new Date().toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          {isDashboard && (
            <>
              <button className="export-btn" onClick={() => exportPilgrimsToExcel(filteredData)}>
                تصدير Excel
              </button>
              {hasAnyFilter && (
                <button className="clear-all-btn" onClick={clearAll}>
                  مسح جميع الفلاتر
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {isJourney && <JourneyPage />}

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
                  onSegmentClick={(v) => toggleChart('chart_nationality', v)}
                  layout="vertical"
                  maxLabelLen={14}
                />
              </ChartWrapper>
            </div>

            {/* Row 6: Accommodation Status */}
            <div className="chart-span-1">
              <ChartWrapper title="عدد الحجاج حسب حالة السكن" height={250}>
                <BarChart
                  data={accommodationStatusData}
                  onSegmentClick={(v) => toggleChart('chart_accommodation_status', v)}
                />
              </ChartWrapper>
            </div>

            {/* Row 7: Package Name */}
            <div className="chart-span-3">
              <ChartWrapper title="عدد الحجاج حسب الباقة" height={270}>
                <BarChart
                  data={packageData}
                  onSegmentClick={(v) => toggleChart('chart_package', v)}
                  maxLabelLen={12}
                />
              </ChartWrapper>
            </div>

            {/* Row 8: Company */}
            <div className="chart-span-2">
              <ChartWrapper title="عدد الحجاج حسب الشركة" height={260}>
                <BarChart
                  data={companyData}
                  onSegmentClick={(v) => toggleChart('chart_company', v)}
                  layout="vertical"
                  maxLabelLen={16}
                />
              </ChartWrapper>
            </div>

            {/* Row 9: Age Histogram */}
            <div className="chart-span-2">
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
