'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Building2 } from 'lucide-react';

function RegisterB2BContent() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    
    // 1. Crear usuario
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
      setLoading(false);
      return;
    }

    // 2. Asignar rol INSTITUTION
    if (data.user) {
      await supabase.from('profiles').update({
        full_name: name,
        role: 'INSTITUTION'
      }).eq('id', data.user.id);
    }

    toast({ title: 'Cuenta creada', description: 'Por favor completa tu afiliación.', variant: 'success' });
    
    // 3. Redirigir al formulario completo
    router.push('/admin/institutions/affiliation');
  }

  return (
    <Card className="w-full max-w-sm shadow-lg border-slate-200">
      <CardHeader className="items-center text-center pb-4">
        <div className="w-12 h-12 bg-juntos-blue/10 rounded-full flex items-center justify-center mb-2">
          <Building2 className="w-6 h-6 text-juntos-blue" />
        </div>
        <CardTitle className="text-2xl text-juntos-blue">Registro B2B</CardTitle>
        <CardDescription>Crea una cuenta para tu Institución de Salud</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la Institución</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Clínica San Rafael" />
          </div>
          <div>
            <Label htmlFor="email">Correo electrónico institucional</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="contacto@clinica.com" />
          </div>
          <div>
            <Label htmlFor="password">Contraseña segura</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-juntos-blue hover:bg-juntos-blue/90 text-white" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrar Institución'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
          {/* El enlace de inicio de sesión inteligente los devolverá al formulario B2B */}
          <Link href="/login?redirect=/admin/institutions/affiliation" className="text-juntos-blue font-semibold hover:underline">
            Inicia sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterB2BPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Logo withText={false} size={40} />
        </Link>
      </div>
      <Suspense fallback={<div>Cargando...</div>}>
        <RegisterB2BContent />
      </Suspense>
    </div>
  );
}