'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrImage({ value }: { value: string }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(value, {
          width: 240,
          margin: 2,
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
    return <p className="text-sm text-slate-500">Membuat QR...</p>;
  }

  return (
    <img
      src={src}
      alt="QR Attendance"
      className="h-60 w-60 rounded-lg border bg-white p-2"
    />
  );
}
