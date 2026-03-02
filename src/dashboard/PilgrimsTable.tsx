import { useState, useMemo } from 'react';
import type { Pilgrim } from '../core/types';

interface PilgrimsTableProps {
  data: Pilgrim[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  insideFilterValue?: 'all' | 'inside' | 'outside';
  onInsideFilterChange?: (value: 'all' | 'inside' | 'outside') => void;
}

const PAGE_SIZE = 15;

const GENDER_LABEL: Record<string, string> = {
  Male:   'ذكر',
  Female: 'أنثى',
};

export function PilgrimsTable({
  data,
  searchValue,
  onSearchChange,
  insideFilterValue,
  onInsideFilterChange,
}: PilgrimsTableProps) {
  const [page, setPage]     = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [localInsideFilter, setLocalInsideFilter] = useState<'all' | 'inside' | 'outside'>('all');
  const search = searchValue ?? localSearch;
  const insideFilter = insideFilterValue ?? localInsideFilter;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((p) => {
      const insideMatch =
        insideFilter === 'all' ||
        (insideFilter === 'inside' ? p.inside_kingdom : !p.inside_kingdom);

      if (!insideMatch) return false;
      if (!q) return true;

      return (
        String(p.id).toLowerCase().includes(q) ||
        p.group_id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        p.package.toLowerCase().includes(q) ||
        p.guide_name.toLowerCase().includes(q) ||
        p.booking_id.toLowerCase().includes(q)
      );
    });
  }, [data, search, insideFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (v: string) => {
    if (onSearchChange) onSearchChange(v);
    else setLocalSearch(v);
    setPage(1);
  };

  const handleInsideFilter = (value: 'all' | 'inside' | 'outside') => {
    if (onInsideFilterChange) onInsideFilterChange(value);
    else setLocalInsideFilter(value);
    setPage(1);
  };

  return (
    <div className="pilgrims-table-wrap">
      {/* Header bar */}
      <div className="pilgrims-table-header">
        <h3 className="pilgrims-table-title">جدول الحجاج</h3>
        <div className="pilgrims-table-meta">
          <span className="pilgrims-table-count">{filtered.length.toLocaleString()} حاج</span>
          <select
            className="pilgrims-table-search"
            value={insideFilter}
            onChange={(e) => {
              handleInsideFilter(e.target.value as 'all' | 'inside' | 'outside');
            }}
          >
            <option value="all">كل الحالات</option>
            <option value="inside">داخل المملكة</option>
            <option value="outside">خارج المملكة</option>
          </select>
          <input
            className="pilgrims-table-search"
            type="text"
            placeholder="بحث بـ nusuk_id أو group_id أو الاسم..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="pilgrims-table-scroll">
        <table className="pilgrims-table">
          <thead>
            <tr>
              <th>nusuk_id</th>
              <th>group_id</th>
              <th>الجنس</th>
              <th>الاسم</th>
              <th>تاريخ الميلاد</th>
              <th>العمر</th>
              <th>المرشد</th>
              <th>بلد الإقامة</th>
              <th>الجنسية</th>
              <th>داخل المملكة</th>
              <th>اسم الباقة</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={11} className="pilgrims-table-empty">لا توجد نتائج</td>
              </tr>
            ) : (
              slice.map((p) => (
                <tr key={p.id}>
                  <td className="pilgrims-table-num">{p.id}</td>
                  <td>{p.group_id || '—'}</td>
                  <td>
                    <span className={`gender-badge gender-${p.gender.toLowerCase()}`}>
                      {GENDER_LABEL[p.gender] ?? p.gender}
                    </span>
                  </td>
                  <td className="pilgrims-table-name">{p.name || '—'}</td>
                  <td>{p.birth_date || '—'}</td>
                  <td>{p.age || '—'}</td>
                  <td>{p.guide_name || '—'}</td>
                  <td>{p.residence_country || '—'}</td>
                  <td>{p.nationality || '—'}</td>
                  <td>{p.inside_kingdom ? 'نعم' : 'لا'}</td>
                  <td>{p.package || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pilgrims-table-pagination">
          <button
            className="pt-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            ‹ السابق
          </button>
          <span className="pt-pages">
            {safePage} / {totalPages}
          </span>
          <button
            className="pt-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            التالي ›
          </button>
        </div>
      )}
    </div>
  );
}
