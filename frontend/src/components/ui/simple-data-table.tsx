'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
  searchableValue?: (row: T) => string;
};

interface SimpleDataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder: string;
  emptyText: string;
}

export function SimpleDataTable<T>({
  rows,
  columns,
  searchPlaceholder,
  emptyText,
}: SimpleDataTableProps<T>) {
  const [query, setQuery] = useState('');

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) =>
      columns.some((column) => {
        if (!column.searchableValue) {
          return false;
        }

        return column
          .searchableValue(row)
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    );
  }, [columns, query, rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">
          Menampilkan {filteredRows.length} dari {rows.length} data
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm md:max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row, index) => (
              <tr key={index} className="align-top">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-4 text-sm text-slate-700 ${column.className || ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRows.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}
