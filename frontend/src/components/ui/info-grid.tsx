'use client';

export function InfoGrid({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="text-sm text-slate-500">{item.label}</p>
          <div className="mt-1 font-medium text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
