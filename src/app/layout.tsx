import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'JUNTOS | Acompanamiento humano no clinico (RD)',
  description:
    'Plataforma JUNTOS: solicitud y pago de acompanamiento por horas (B2C) y CRM de instituciones (B2B) en Republica Dominicana.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/images/logo-juntos.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
