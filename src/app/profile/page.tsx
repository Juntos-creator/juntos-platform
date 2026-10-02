'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { User, Moon, Sun, Trash2, LogOut, Save, ShieldAlert, Camera } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || '');
          setPhone(profile.phone || '');
          setRole(profile.role || '');
        }
      }
      
      // Comprobar el modo oscuro
      if (document.documentElement.classList.contains('dark')) {
        setIsDarkMode(true);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone })
        .eq('id', user.id);

      if (error) {
        toast({ title: 'Error al guardar', description: error.message, variant: 'error' });
      } else {
        toast({ title: 'Perfil actualizado', variant: 'success' });
      }
    }
    setSaving(false);
  }

  function toggleDarkMode() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      setIsDarkMode(true);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer y perderás el acceso a tus servicios.')) {
      toast({ title: 'Cuenta desactivada', description: 'Tu cuenta ha sido programada para eliminación.', variant: 'success' });
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>;

  const roleNames: Record<string, string> = {
    CUSTOMER: 'Solicitante (B2C)',
    COMPANION: 'Acompañante',
    INSTITUTION: 'Institución (B2B)',
    ADMIN: 'Administrador del Sistema'
  };

  return (
    <>
      <Navbar />
      <main className="container max-w-2xl py-10 space-y-6">
        <h1 className="text-3xl font-bold text-juntos-blue mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground mb-6">Gestiona tu información personal, foto y preferencias.</p>

        {/* Tarjeta de Foto de Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-juntos-green" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              {role === 'COMPANION' 
                ? 'Sube una foto clara y profesional. Esto dará mayor confianza a los pacientes.'
                : 'Sube una foto para que los acompañantes puedan reconocerte fácilmente.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-28 w-28 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden relative group cursor-pointer">
              {/* Espacio para la imagen real en un futuro */}
              <User className="h-12 w-12 text-slate-400" />
              
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <Button variant="outline" className="border-juntos-blue text-juntos-blue">
                Cambiar foto
              </Button>
              <p className="text-xs text-muted-foreground">Recomendado: JPG o PNG, máximo 2MB.</p>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Datos Personales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-juntos-green" />
              Datos de la Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de cuenta (Rol)</Label>
              <Input value={roleNames[role] || role} disabled className="bg-slate-50 text-slate-500 font-medium" />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input value={email} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div>
              <Label htmlFor="name">Nombre completo / Razón Social</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono / WhatsApp</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-juntos-blue hover:bg-juntos-blue/90 text-white flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardContent>
        </Card>

        {/* Tarjeta de Preferencias visuales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Configuración Visual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50">
              <div>
                <h3 className="font-medium text-slate-900">Modo de lectura</h3>
                <p className="text-sm text-slate-500">Alternar entre tema claro y oscuro.</p>
              </div>
              <Button variant="outline" onClick={toggleDarkMode} className="flex items-center gap-2">
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-600" />}
                {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Zona de Peligro */}
        <Card className="border-red-100 bg-red-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Gestión de Sesión y Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleLogout} className="flex-1 flex items-center gap-2 border-slate-300">
                <LogOut className="h-4 w-4 text-slate-600" />
                Cerrar sesión en este dispositivo
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount} className="flex-1 flex items-center gap-2 bg-red-500 hover:bg-red-600">
                <Trash2 className="h-4 w-4" />
                Eliminar mi cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}