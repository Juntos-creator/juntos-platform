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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Captura el destino original (ej. si venía de B2C o de B2B)
  const redirectPath = searchParams.get('redirect');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      toast({ title: 'Error al ingresar', description: 'Correo o contraseña incorrectos.', variant: 'error' });
      return;
    }

    toast({ title: 'Bienvenido de nuevo', variant: 'success' });
    
    // Si el usuario intentaba ir a una página específica (ej. Solicitar servicio), lo mandamos ahí
    if (redirectPath) {
      router.push(redirectPath);
    } else {
      // Si entró directo a la app, lo mandamos a la portada principal para que elija
      router.push('/');
    }
    
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm shadow-lg border-slate-200">
      <CardHeader className="items-center text-center pb-4">
        <Logo size={56} withText={false} />
        <CardTitle className="text-2xl text-juntos-blue mt-2">Iniciar sesión</CardTitle>
        <CardDescription>
          {redirectPath 
            ? 'Ingresa a tu cuenta para continuar con tu solicitud' 
            : 'Accede a tu cuenta de JUNTOS'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full h-11 bg-juntos-blue text-white hover:bg-juntos-blue/90" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar a mi cuenta'}
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            ¿No estás registrado?
          </p>
          <Button asChild variant="outline" className="w-full text-juntos-green border-juntos-green hover:bg-juntos-green/10">
            {/* Si venía de B2C, le pasamos la ruta al registro para que no pierda el hilo */}
            <Link href={`/register${redirectPath ? `?redirect=${redirectPath}` : ''}`}>
              Crear una cuenta nueva
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Suspense es obligatorio en Next.js cuando usamos useSearchParams()
export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Suspense fallback={<div>Cargando pantalla de acceso...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}