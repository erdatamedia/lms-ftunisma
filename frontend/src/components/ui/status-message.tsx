'use client';

export function StatusMessage({
  type,
  text,
}: {
  type: 'error' | 'success' | 'info';
  text: string;
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-600',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      {text}
    </div>
  );
}
