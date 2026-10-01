import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Logo oficial JUNTOS. Usa el PNG en /public/images/logo-juntos.png.
 * `showWordmark` muestra la imagen completa (icono + palabra).
 */
export function Logo({
  size = 40,
  className,
  withText = true,
}: {
  size?: number;
  className?: string;
  withText?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/images/logo-juntos.png"
        alt="JUNTOS"
        width={size}
        height={size}
        priority
        className="object-contain"
      />
      {withText && (
        <span className="font-bold tracking-tight text-juntos-blue dark:text-white text-lg">
          JUNTOS
        </span>
      )}
    </div>
  );
}
