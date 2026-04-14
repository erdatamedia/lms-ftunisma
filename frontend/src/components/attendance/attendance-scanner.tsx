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

      {zoomRange && scanning && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Zoom Kamera</p>
              <p className="mt-1 text-xs text-slate-500">
                Naikkan zoom agar QR di layar proyektor tetap bisa dipindai dari
                jarak jauh.
              </p>
            </div>

            <div className="text-sm font-medium text-slate-700">
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
            className="mt-4 w-full"
            disabled={zoomApplying}
          />
        </div>
      )}

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
