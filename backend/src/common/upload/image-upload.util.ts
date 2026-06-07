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
      .slice(0, 80) || 'image'
  );
}

export function imageFileFilter(
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = extname(file.originalname).toLowerCase();

  if (
    !allowedMimeTypes.includes(file.mimetype) ||
    !allowedExtensions.includes(ext)
  ) {
    return callback(
      new BadRequestException(
        'Hanya file gambar (JPG, JPEG, PNG, WEBP) yang diperbolehkan',
      ),
      false,
    );
  }

  callback(null, true);
}

import * as fs from 'fs';

export function imageStorage(destination: string) {
  return diskStorage({
    destination: (req, file, callback) => {
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }
      callback(null, destination);
    },
    filename: (req, file, callback) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const baseName = sanitizeBaseName(file.originalname);
      const ext = extname(file.originalname).toLowerCase();
      callback(null, `${timestamp}-${random}-${baseName}${ext}`);
    },
  });
}

export const imageLimits = {
  fileSize: 2 * 1024 * 1024, // 2MB limit
};
