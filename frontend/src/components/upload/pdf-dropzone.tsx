'use client';

import { useRef, useState } from 'react';

interface PdfDropzoneProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
}

export function PdfDropzone({
  label,
  file,
  onFileChange,
  required = false,
}: PdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      onFileChange(null);
      setError('');
      return;
    }

    const isPdf =
      selectedFile.type === 'application/pdf' ||
      selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setError('Hanya file PDF yang diperbolehkan.');
      onFileChange(null);
      return;
    }

    setError('');
    onFileChange(selectedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    validateFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const selectedFile = e.dataTransfer.files?.[0] || null;
    validateFile(selectedFile);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label} {required ? '*' : ''}
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          isDragging
            ? 'border-slate-900 bg-slate-50'
            : 'border-slate-300 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        {file ? (
          <div>
            <p className="font-medium">{file.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                setError('');
              }}
              className="mt-3 text-sm text-red-500 hover:underline"
            >
              Hapus file
            </button>
          </div>
        ) : (
          <div>
            <p className="font-medium">Drop file PDF di sini</p>
            <p className="mt-1 text-sm text-slate-500">
              atau klik untuk memilih file
            </p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
