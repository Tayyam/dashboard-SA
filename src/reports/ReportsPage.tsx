import { useMemo } from 'react';
import { usePilgrimsData } from '../store/usePilgrimsData';
import { PACKAGE_TYPE_MATRIX, countPilgrimsByPackageType } from '../core/packageTypeReport';

function CityPill({ value }: { value: string | null }) {
  if (!value || value === '—') {
    return <span className="reports-city reports-city--empty">—</span>;
  }
  const k = value.trim().toLowerCase();
  const variant =
    k === 'madinah' ? 'madinah' : k === 'makkah' ? 'makkah' : k === 'mina' ? 'mina' : 'other';
  return <span className={`reports-city reports-city--${variant}`}>{value}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const n = type.replace(/^T/i, '');
  return (
    <span className={`reports-type-badge reports-type-badge--t${n}`} data-type={type}>
      {type}
    </span>
  );
}

export function ReportsPage() {
  const data = usePilgrimsData((s) => s.data);
  const loading = usePilgrimsData((s) => s.loading);

  const { byType, unmatched } = useMemo(() => countPilgrimsByPackageType(data), [data]);
  const totalClassified = useMemo(
    () => PACKAGE_TYPE_MATRIX.reduce((s, r) => s + byType[r.type], 0),
    [byType]
  );

  return (
    <div className="reports-shell">
      <header className="reports-topbar">
        <div className="reports-topbar-left">
          <span className="reports-topbar-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2 2H5V5h14v14zm2-16H3v18h18V3z"
                fill="currentColor"
                opacity="0.9"
              />
            </svg>
          </span>
          <div>
            <p className="reports-topbar-kicker">مركز التقارير</p>
            <p className="reports-topbar-sub">إحصائيات مباشرة من بيانات الحجاج المحمّلة</p>
          </div>
        </div>
      </header>

      <div className="reports-body">
        <div className="reports-inner">
          {loading && data.length === 0 ? (
            <div className="reports-loading-card">
              <div className="reports-loading-pulse" />
              <p>جاري تحميل بيانات الحجاج...</p>
            </div>
          ) : (
            <>
              <div className="reports-stats-row">
                <div className="reports-stat-card reports-stat-card--primary">
                  <span className="reports-stat-label">إجمالي السجلات</span>
                  <span className="reports-stat-value">{data.length.toLocaleString()}</span>
                </div>
                <div className="reports-stat-card">
                  <span className="reports-stat-label">مصنّف T1–T5</span>
                  <span className="reports-stat-value reports-stat-value--green">
                    {totalClassified.toLocaleString()}
                  </span>
                </div>
                <div className="reports-stat-card">
                  <span className="reports-stat-label">غير مطابق للجدول</span>
                  <span className="reports-stat-value reports-stat-value--amber">
                    {unmatched.toLocaleString()}
                  </span>
                </div>
              </div>

              <section className="reports-card">
                <div className="reports-card-head">
                  <h2 className="reports-card-title">تقرير أنواع الباقات (T1–T5)</h2>
                  <p className="reports-card-desc">
                    Package type، أرقام الباقات، وترتيب التوقفات (first / second / third) مع العدد
                    الفعلي من البيانات المحمّلة.
                  </p>
                </div>

                <div className="reports-table-scroll">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th scope="col">Type</th>
                        <th scope="col">Package Numbers</th>
                        <th scope="col">first</th>
                        <th scope="col">second</th>
                        <th scope="col">third</th>
                        <th scope="col">عدد الحجاج</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PACKAGE_TYPE_MATRIX.map((row) => (
                        <tr key={row.type}>
                          <td>
                            <TypeBadge type={row.type} />
                          </td>
                          <td>
                            <div className="reports-codes">{row.packageNumbers.join(', ')}</div>
                          </td>
                          <td>
                            <CityPill value={row.first} />
                          </td>
                          <td>
                            <CityPill value={row.second} />
                          </td>
                          <td>
                            <CityPill value={row.third} />
                          </td>
                          <td>
                            <span className="reports-count">{byType[row.type].toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
