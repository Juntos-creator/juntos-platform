import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { AdminQuickNav } from '@/components/admin/AdminQuickNav';

export const metadata: Metadata = {
  title: 'JUNTOS | Acompañamiento humano no clínico (RD)',
  description:
    'Plataforma JUNTOS: solicitud y pago de acompañamiento por horas (B2C) y CRM de instituciones (B2B) en República Dominicana.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/images/logo-juntos.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-slate-900 text-slate-100 antialiased">
        <ToastProvider>
          {children}
          {/* Barra de navegación maestra para el Administrador */}
          <AdminQuickNav />
        </ToastProvider>
      </body>
    </html>
  );
}