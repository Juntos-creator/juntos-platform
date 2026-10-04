import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Radio, 
  Users, 
  CalendarPlus, 
  HeartHandshake, 
  Receipt, 
  LogOut 
} from 'lucide-react';

const ADMIN_NAV = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Mesa de Operaciones 24/7', href: '/admin/operations', icon: Radio },
  { label: 'Mesa / Perfil Central', href: '/profile', icon: Users },
  { label: 'Wizard Solicitud', href: '/services/new', icon: CalendarPlus },
  { label: 'Portal Acompañante', href: '/companion', icon: HeartHandshake },
];