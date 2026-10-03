import Link from 'next/link';
import { Radio } from 'lucide-react';

// Dentro de tu barra de navegación o menú de usuario:
<Link
  href="/admin/mesa-operaciones"
  className="flex items-center gap-2 bg-blue-950 text-white hover:bg-blue-900 border border-blue-700/50 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
>
  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
  <Radio className="w-3.5 h-3.5 text-emerald-400" />
  Mesa de Operaciones
</Link>