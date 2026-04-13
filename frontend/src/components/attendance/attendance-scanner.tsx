'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api, getApiErrorMessage } from '@/lib/api';

export function AttendanceScanner() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'attendance-qr-reader';

  const submitToken = async (qrToken: string) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.post(
        '/attendance/scan',
        {
          qrToken,
          deviceInfo: 'Frontend QR Scanner',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSuccess(
        `Absensi ${data.attendanceSession?.type || ''} berhasil pada ${new Date(
          data.scannedAt,
        ).toLocaleString('id-ID')}`,
      );
      setManualToken('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const startScanner = async () => {
    try {
      setError('');
      setSuccess('');

      if (scannerRef.current) {
        return;
      }

      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        async (decodedText) => {
          await stopScanner();
          await submitToken(decodedText);
        },
        () => {},
      );

      setScanning(true);
    } catch (err: any) {
      setError(err?.message || 'Gagal membuka kamera');
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('Stop scanner error:', err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Scan Absensi QR</h3>
      <p className="mt-1 text-sm text-slate-500">
        Gunakan kamera untuk scan QR, atau tempel token manual.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Mulai Scan Kamera
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white"
          >
            Stop Scanner
          </button>
        )}
      </div>

      <div
        id={scannerElementId}
        className="mt-4 max-w-md overflow-hidden rounded-lg border"
      />

      <div className="mt-6 space-y-3">
        <label className="block text-sm font-medium">Atau input token manual</label>
        <textarea
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          className="min-h-[100px] w-full rounded-lg border px-3 py-2"
          placeholder="Tempel qrToken di sini"
        />
        <button
          onClick={() => submitToken(manualToken)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Submit Token
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {success && <p className="mt-4 text-sm text-green-600">{success}</p>}
    </div>
  );
}
