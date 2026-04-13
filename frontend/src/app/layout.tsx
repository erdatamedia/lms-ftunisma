import type { Metadata } from 'next';
import './globals.css';
import { AuthHydrator } from '@/components/auth/auth-hydrator';

export const metadata: Metadata = {
  title: 'LMS UNISMA',
  description: 'Frontend LMS Informatika FT Unisma',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthHydrator />
        {children}
      </body>
    </html>
  );
}
