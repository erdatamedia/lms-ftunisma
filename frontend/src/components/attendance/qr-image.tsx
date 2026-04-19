'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrImage({ value, size = 'responsive' }: { value: string; size?: 'responsive' | 'small' }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(value, {
          width: 600,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        });

        if (mounted) {
          setSrc(dataUrl);
        }
      } catch (error) {
        console.error('QR generation failed:', error);
      }
    };

    if (value) {
      run();
    }

    return () => {
      mounted = false;
    };
  }, [value]);

  if (!src) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-500">Membuat QR...</p>
      </div>
    );
  }

  if (size === 'small') {
    return (
      <img
        src={src}
        alt="QR Attendance"
        className="h-40 w-40 rounded-xl border border-slate-200 bg-white p-2"
      />
    );
  }

  return (
    <img
      src={src}
      alt="QR Attendance"
      className="w-full max-w-sm rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm sm:max-w-xs"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
