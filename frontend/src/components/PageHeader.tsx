import type { ReactNode } from 'react';

interface PageHeaderProps {
  kicker: string;
  title: ReactNode;
  description?: string;
  /** Contenido alineado a la derecha (botones, conmutadores, contadores). */
  action?: ReactNode;
  className?: string;
}

/** Cabecera de sección compartida: kicker + título + descripción, como en el diseño. */
export default function PageHeader({ kicker, title, description, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`anim-fade-up mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end ${className}`}>
      <div className="min-w-0">
        <p className="section-kicker">{kicker}</p>
        <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex flex-shrink-0 items-center gap-3">{action}</div>}
    </div>
  );
}
