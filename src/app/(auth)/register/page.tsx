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
import { User, HeartHandshake } from 'lucide-react';

import RegistroAcompanante from './RegistroAcompanante';

function RegisterContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'COMPANION'>('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Si elige Acompañante, mostramos directamente las 4 fases
  if (selectedRole === 'COMPANION') {
    return (
      <div className="w-full">
        <div className="max-w-lg mx-auto mb-2">
          <button
            type="button"
            onClick={() => setSelectedRole('CUSTOMER')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            ‹ Volver a registro de Solicitante
          </button>
        </div>
        <RegistroAcompanante />
      </div>
    );
  }

  // Formulario rápido para Solicitante
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden.', variant: 'error' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Contraseña débil', description: 'Mínimo 6 caracteres.', variant: 'error' });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').update({
        full_name: name,
        phone,
        role: 'CUSTOMER',
      }).eq('id', data.user.id);
    }

    toast({ title: 'Cuenta creada', description: 'Bienvenido a JUNTOS', variant: 'success' });
    router.push('/');
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200 mt-8">
      <CardHeader className="items-center text-center pb-2">
        <Logo withText={false} size={48} className="mb-2" />
        <CardTitle className="text-2xl text-juntos-blue">Crear cuenta</CardTitle>
        <CardDescription>Selecciona el tipo de cuenta con el que deseas ingresar</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Selector de pestañas */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('CUSTOMER')}
            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              selectedRole === 'CUSTOMER'
                ? 'bg-white text-juntos-blue shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Solicitante
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('COMPANION')}
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all text-slate-600 hover:text-slate-900"
          >
            <HeartHandshake className="w-4 h-4" /> Acompañante
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono / WhatsApp</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+1 809..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repite clave" />
            </div>
          </div>
          <Button type="submit" className="w-full text-white bg-juntos-blue hover:bg-juntos-blue/90" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarme como Solicitante'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
          <Link href="/login" className="text-juntos-blue font-semibold hover:underline">
            Inicia sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" title="Volver al inicio">
          <Logo withText={false} size={40} />
        </Link>
      </div>
      <Suspense fallback={<div>Cargando...</div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}