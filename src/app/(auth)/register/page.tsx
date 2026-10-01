'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      toast({ title: 'Error al registrarse', description: error.message, variant: 'error' });
      return;
    }
    // Crea el perfil (rol CUSTOMER por defecto)
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, full_name: fullName, phone, role: 'CUSTOMER',
      });
    }
    setLoading(false);
    toast({ title: 'Cuenta creada', description: 'Revisa tu correo si se requiere confirmacion.', variant: 'success' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen grid place-items-center bg-juntos-blue-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center">
          <Logo size={56} withText={false} />
          <CardTitle className="text-juntos-blue">Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 809..." />
            </div>
            <div>
              <Label htmlFor="password">Contrasena</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" variant="success" className="w-full" disabled={loading}>
              {loading ? 'Creando...' : 'Registrarme'}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="text-juntos-blue font-medium">Ingresa</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
