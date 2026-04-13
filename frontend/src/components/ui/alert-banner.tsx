'use client';

export function AlertBanner({
  type,
  text,
  onClose,
}: {
  type: 'error' | 'success' | 'info' | 'warning';
  text: string;
  onClose?: () => void;
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      <div>{text}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-xs hover:bg-black/5"
        >
          Tutup
        </button>
      )}
    </div>
  );
}
