'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const links = [
  { href: '/services/new', label: 'Solicitar servicio' },
  { href: '/admin/institutions', label: 'CRM' },
  { href: '/admin/payments', label: 'Pagos' },
  { href: '/admin/invoices', label: 'Facturas' },
  { href: '/admin/audit', label: 'Auditoria' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-juntos-blue text-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo withText className="[&_span]:text-white" />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition',
                pathname.startsWith(l.href) && 'bg-white/15'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Button variant="success" size="sm" onClick={logout}>
          Salir
        </Button>
      </div>
    </header>
  );
}
