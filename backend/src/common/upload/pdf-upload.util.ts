import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

function sanitizeBaseName(name: string) {
  return (
    name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'file'
  );
}

export function pdfFileFilter(
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = extname(file.originalname).toLowerCase() === '.pdf';

  if (!isPdfMime || !isPdfExt) {
    return callback(
      new BadRequestException('Hanya file PDF yang diperbolehkan') as any,
      false,
    );
  }

  callback(null, true);
}

export function pdfStorage(destination: string) {
  return diskStorage({
    destination,
    filename: (req, file, callback) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const baseName = sanitizeBaseName(file.originalname);
      callback(null, `${timestamp}-${random}-${baseName}.pdf`);
    },
  });
}

export const pdfLimits = {
  fileSize: 10 * 1024 * 1024,
};
