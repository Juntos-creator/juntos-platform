'use client';

import { useState } from 'react';
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

type UserRole = 'CUSTOMER' | 'COMPANION';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    // 1. Registro en Supabase Auth con metadata del rol
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone,
        },
      },
    });

    if (error) {
      setLoading(false);
      toast({
        title: 'Error al registrarse',
        description: error.message,
        variant: 'error',
      });
      return;
    }

    // 2. Creación del perfil con el rol seleccionado (CUSTOMER o COMPANION)
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        phone,
        role: role,
      });

      if (profileError) {
        console.error('Error al crear perfil en DB:', profileError);
      }
    }

    setLoading(false);
    toast({
      title: role === 'COMPANION' ? 'Solicitud de acompañante enviada' : 'Cuenta creada con éxito',
      description: 'Revisa tu correo si se requiere confirmación.',
      variant: 'success',
    });

    router.push('/login');
  }

  return (
    <div className="min-h-screen grid place-items-center bg-juntos-blue-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="items-center text-center space-y-2 pb-4">
          <Logo size={56} withText={false} />
          <CardTitle className="text-2xl text-juntos-blue font-bold">Crear cuenta</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Selecciona el tipo de cuenta con el que deseas ingresar
          </CardDescription>

          {/* Selector de rol: Solicitante vs Acompañante */}
          <div className="grid grid-cols-2 gap-2 w-full pt-2">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                role === 'CUSTOMER'
                  ? 'border-juntos-blue bg-juntos-blue text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Solicitante</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('COMPANION')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                role === 'COMPANION'
                  ? 'border-juntos-green bg-juntos-green text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Acompañante</span>
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            {role === 'CUSTOMER'
              ? 'Para pacientes y familiares que requieren servicios de acompañamiento.'
              : 'Para profesionales y personas que brindan acompañamiento humano no clínico.'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>

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
              <Label htmlFor="phone">Teléfono / WhatsApp</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 809..."
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
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              variant={role === 'COMPANION' ? 'success' : 'default'}
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading
                ? 'Registrando...'
                : role === 'COMPANION'
                ? 'Registrarme como Acompañante'
                : 'Registrarme como Solicitante'}
            </Button>
          </form>

          <p className="text-sm text-center mt-5 text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-juntos-blue font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}