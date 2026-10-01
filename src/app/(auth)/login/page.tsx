'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Error al ingresar', description: error.message, variant: 'error' });
      return;
    }
    toast({ title: 'Bienvenido', variant: 'success' });
    router.push(params.get('next') ?? '/services/new');
    router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center bg-juntos-blue-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center">
          <Logo size={56} withText={false} />
          <CardTitle className="text-juntos-blue">Ingresar a JUNTOS</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Contrasena</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            No tienes cuenta?{' '}
            <Link href="/register" className="text-juntos-green font-medium">Registrate</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
