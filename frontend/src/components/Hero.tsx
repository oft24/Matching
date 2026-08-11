import { ChatsCircle, ShieldCheck, SlidersHorizontal } from '@phosphor-icons/react';

const FEATURES = [
  { icon: ShieldCheck, title: 'Perfiles verificados', desc: 'Cuentas enlazadas a Riot y Discord antes de entrar a la cola.' },
  { icon: SlidersHorizontal, title: 'Filtros que importan', desc: 'Rango, rol, región, idioma, micrófono y estilo de juego.' },
  { icon: ChatsCircle, title: 'Chat al aceptar', desc: 'El canal se abre solo cuando ambos aceptan el match.' },
];

interface HeroProps {
  onNavigate: (id: string) => void;
}

/** Cabecera de Inicio: mensaje, dos acciones y las tres garantías del producto. */
export default function Hero({ onNavigate }: HeroProps) {
  return (
    <>
      <section className="anim-fade-up mb-8 max-w-[660px]">
        <p className="section-kicker">Tu sesión de hoy</p>
        <h1 className="mt-3 text-[clamp(26px,3vw,38px)] leading-[1.1] text-balance text-[var(--color-text)]">
          Elige el juego y te buscamos compañeros compatibles.
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] text-[color-mix(in_srgb,var(--color-text)_68%,transparent)]">
          Rango, rol, idioma y estilo de juego se comparan antes de proponerte a nadie.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => onNavigate('buscar')} className="primary-button px-4 py-2 text-sm">
            Buscar jugadores
          </button>
          <button onClick={() => onNavigate('dashboard')} className="ghost-button px-4 py-2 text-sm">
            Ver mi rendimiento
          </button>
        </div>
      </section>

      <section className="stagger mt-8 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="surface rounded-[var(--radius-md)] p-4">
            <Icon className="h-5 w-5 text-[var(--color-accent)]" />
            <p className="mt-2 text-[17px] font-medium text-[var(--color-text)]">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
              {desc}
            </p>
          </div>
        ))}
      </section>
    </>
  );
}
