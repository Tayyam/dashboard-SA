import { useState, useMemo } from 'react';
import type { Pilgrim } from '../core/types';
import { cn } from '../lib/cn';

interface PilgrimsTableProps {
  data: Pilgrim[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  insideFilterValue?: 'all' | 'inside' | 'outside';
  onInsideFilterChange?: (value: 'all' | 'inside' | 'outside') => void;
}

const PAGE_SIZE = 15;

const GENDER_LABEL: Record<string, string> = {
  Male: 'ذكر',
  Female: 'أنثى',
};

export function PilgrimsTable({
  data,
  searchValue,
  onSearchChange,
  insideFilterValue,
  onInsideFilterChange,
}: PilgrimsTableProps) {
  const [page, setPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [localInsideFilter, setLocalInsideFilter] = useState<'all' | 'inside' | 'outside'>('all');
  const search = searchValue ?? localSearch;
  const insideFilter = insideFilterValue ?? localInsideFilter;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((p) => {
      const insideMatch =
        insideFilter === 'all' || (insideFilter === 'inside' ? p.inside_kingdom : !p.inside_kingdom);

      if (!insideMatch) return false;
      if (!q) return true;

      return (
        String(p.id).toLowerCase().includes(q) ||
        p.group_id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        p.package_id.toLowerCase().includes(q) ||
        p.package.toLowerCase().includes(q) ||
        p.guide_name.toLowerCase().includes(q) ||
        p.booking_id.toLowerCase().includes(q)
      );
    });
  }, [data, search, insideFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  const inputSelectClass =
    'rounded-md border border-border bg-page text-xs text-fg outline-none transition-colors duration-150 focus:border-primary rtl:text-right';

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h3 className="m-0 text-[11px] font-bold tracking-wide text-fg-secondary uppercase">جدول الحجاج</h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="whitespace-nowrap text-[11px] text-fg-secondary">{filtered.length.toLocaleString()} حاج</span>
          <select
            className={cn(inputSelectClass, 'px-2.5 py-1')}
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
            className={cn(inputSelectClass, 'w-[200px] max-w-full px-2.5 py-1')}
            type="text"
            placeholder="بحث بـ nusuk_id أو group_id أو الاسم..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="max-h-[380px] overflow-auto overflow-x-auto">
        <table className="w-full border-collapse text-xs rtl:text-right">
          <thead className="sticky top-0 z-[1]">
            <tr>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                nusuk_id
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                group_id
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                الجنس
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                الاسم
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                تاريخ الميلاد
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                العمر
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                المرشد
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                بلد الإقامة
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                الجنسية
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                داخل المملكة
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                نوع الباقة (package type)
              </th>
              <th className="whitespace-nowrap bg-primary px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-white">
                اسم الباقة
              </th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-sm text-fg-secondary">
                  لا توجد نتائج
                </td>
              </tr>
            ) : (
              slice.map((p) => (
                <tr key={p.id} className="last:[&>td]:border-b-0 hover:[&>td]:bg-primary/[0.04]">
                  <td className="w-10 whitespace-nowrap border-b border-gray-100 px-3 py-2 text-[11px] text-fg-secondary">{p.id}</td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-fg">{p.group_id || '—'}</td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                        p.gender.toLowerCase() === 'male' && 'bg-primary/12 text-primary',
                        p.gender.toLowerCase() === 'female' && 'bg-blue-600/12 text-blue-600',
                      )}
                    >
                      {GENDER_LABEL[p.gender] ?? p.gender}
                    </span>
                  </td>
                  <td className="min-w-[120px] whitespace-nowrap border-b border-gray-100 px-3 py-2 font-medium text-fg">
                    {p.name || '—'}
                  </td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-fg">{p.birth_date || '—'}</td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-fg">{p.age || '—'}</td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-fg">{p.guide_name || '—'}</td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-fg">{p.residence_country || '—'}</td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-fg">{p.nationality || '—'}</td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-fg">{p.inside_kingdom ? 'نعم' : 'لا'}</td>
                  <td className="w-10 whitespace-nowrap border-b border-gray-100 px-3 py-2 text-[11px] text-fg-secondary">
                    {p.package_id?.trim() || '—'}
                  </td>
                  <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-fg">{p.package || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-4 py-2.5">
          <button
            type="button"
            className="cursor-pointer rounded-md border border-border bg-page px-3.5 py-1 text-xs text-fg transition-colors duration-150 hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            ‹ السابق
          </button>
          <span className="min-w-[60px] text-center text-xs text-fg-secondary">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            className="cursor-pointer rounded-md border border-border bg-page px-3.5 py-1 text-xs text-fg transition-colors duration-150 hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
