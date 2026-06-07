'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api, getApiErrorMessage } from '@/lib/api';
import { AlertBanner } from '@/components/ui/alert-banner';

type ZoomRange = {
  min: number;
  max: number;
  step: number;
};

type ZoomCapability = {
  min: number;
  max: number;
  step?: number;
};

export function AttendanceScanner() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomApplying, setZoomApplying] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'attendance-qr-reader';

  const resetZoomState = () => {
    setZoomRange(null);
    setZoomLevel(1);
    setZoomApplying(false);
  };

  const syncZoomCapability = () => {
    try {
      const scanner = scannerRef.current;
      if (!scanner) return;

      const capabilities = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & {
        zoom?: ZoomCapability;
      };
      const settings = scanner.getRunningTrackSettings() as MediaTrackSettings & {
        zoom?: number;
      };
      const zoomCapability = capabilities.zoom;

      if (
        !zoomCapability ||
        typeof zoomCapability.min !== 'number' ||
        typeof zoomCapability.max !== 'number'
      ) {
        resetZoomState();
        return;
      }

      const step =
        typeof zoomCapability.step === 'number' && zoomCapability.step > 0
          ? zoomCapability.step
          : 0.1;
      const fallbackZoom =
        typeof settings.zoom === 'number' ? settings.zoom : zoomCapability.min;

      setZoomRange({
        min: zoomCapability.min,
        max: zoomCapability.max,
        step,
      });
      setZoomLevel(fallbackZoom);
    } catch {
      resetZoomState();
    }
  };

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

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('Stop scanner error:', err);
    } finally {
      setScanning(false);
      resetZoomState();
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
      syncZoomCapability();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Gagal membuka kamera',
      );
      await stopScanner();
    }
  };

  const applyZoom = async (nextZoom: number) => {
    const scanner = scannerRef.current;
    if (!scanner || !zoomRange) {
      return;
    }

    try {
      setZoomApplying(true);
      setError('');
      await scanner.applyVideoConstraints({
        advanced: [
          {
            zoom: nextZoom,
          } as MediaTrackConstraintSet,
        ],
      });
      setZoomLevel(nextZoom);
    } catch {
      setError('Kamera ini tidak mendukung pengaturan zoom manual.');
      resetZoomState();
    } finally {
      setZoomApplying(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          Silakan lakukan scan QR code yang ditunjukkan oleh dosen di layar kelas, atau masukkan token sesi absensi secara manual.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-850 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            Mulai Scan Kamera
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
          >
            Stop Scanner
          </button>
        )}
      </div>

      {zoomRange && scanning && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Zoom Kamera</p>
              <p className="mt-1 text-xs text-slate-500">
                Naikkan zoom agar QR di layar proyektor tetap bisa dipindai dari jarak jauh.
              </p>
            </div>

            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {zoomLevel.toFixed(1)}x
            </div>
          </div>

          <input
            type="range"
            min={zoomRange.min}
            max={zoomRange.max}
            step={zoomRange.step}
            value={zoomLevel}
            onChange={(e) => {
              const nextZoom = Number(e.target.value);
              setZoomLevel(nextZoom);
              void applyZoom(nextZoom);
            }}
            className="mt-4 w-full cursor-pointer accent-emerald-500"
            disabled={zoomApplying}
          />
        </div>
      )}

      <div
        id={scannerElementId}
        className="max-w-md overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900"
      />

      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Atau input token manual</label>
        <textarea
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          className="min-h-[90px] w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-slate-900 focus:outline-none"
          placeholder="Tempel qrToken di sini..."
        />
        <button
          onClick={() => submitToken(manualToken)}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-850 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          Submit Token
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <AlertBanner type="error" text={error} onClose={() => setError('')} />
        </div>
      )}
      {success && (
        <div className="mt-4">
          <AlertBanner
            type="success"
            text={success}
            onClose={() => setSuccess('')}
          />
        </div>
      )}
    </div>
  );
}
