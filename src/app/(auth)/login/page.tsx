'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

function LoginContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 1. Iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ title: 'Error de acceso', description: 'Credenciales incorrectas.', variant: 'error' });
      setLoading(false);
      return;
    }

    toast({ title: 'Bienvenido', description: 'Iniciando sesión...', variant: 'success' });

    // 2. Buscar el rol del usuario directamente en la base de datos
    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const userRole = profile?.role;
      const explicitRedirect = searchParams.get('redirect');

      // Si hay una redirección forzada en la URL (ej. desde un botón específico)
      if (explicitRedirect && explicitRedirect !== '/') {
        window.location.href = explicitRedirect;
        return;
      }

      // Redirección inteligente por roles
      if (userRole === 'COMPANION') {
        window.location.href = '/companion/dashboard';
        return;
      }

      if (userRole === 'INSTITUTION' || userRole === 'ADMIN') {
        window.location.href = '/admin/institutions';
        return;
      }
    }

    // 3. Si es CUSTOMER o no tiene rol, va al inicio
    window.location.href = '/';
  }

  return (
    <Card className="w-full max-w-sm shadow-lg border-slate-200">
      <CardHeader className="items-center text-center pb-4">
        <CardTitle className="text-2xl text-juntos-blue">Iniciar sesión</CardTitle>
        <CardDescription>Ingresa a tu cuenta de JUNTOS</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-juntos-blue hover:bg-juntos-blue/90 text-white" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm space-y-2">
          <div>
            <span className="text-muted-foreground">¿No tienes cuenta? </span>
            <Link href="/register" className="text-juntos-blue font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </div>
          <div>
            <span className="text-muted-foreground">¿Eres una institución? </span>
            <Link href="/register-b2b" className="text-juntos-green font-semibold hover:underline">
              Portal B2B
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4 relative">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" title="Volver al inicio">
          <Logo withText={false} size={40} />
        </Link>
      </div>
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}