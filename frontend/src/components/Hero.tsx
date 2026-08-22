import { ArrowRight, ChatsCircle, Lightning, ShieldCheck, SlidersHorizontal, UsersThree } from '@phosphor-icons/react';

const FEATURES = [
  { icon: ShieldCheck, title: 'Perfiles verificados', desc: 'Cuentas enlazadas a Riot y Discord antes de entrar a la cola.' },
  { icon: SlidersHorizontal, title: 'Filtros que importan', desc: 'Rango, rol, región, idioma, micrófono y estilo de juego.' },
  { icon: ChatsCircle, title: 'Chat al aceptar', desc: 'El canal se abre solo cuando ambos aceptan el match.' },
];

interface HeroProps {
  onNavigate: (id: string) => void;
}

/** Cabecera de Inicio: orienta la sesión y hace visible la actividad del producto. */
export default function Hero({ onNavigate }: HeroProps) {
  return (
    <>
      <section className="home-hero anim-fade-up">
        <div className="home-hero-grid" aria-hidden="true" />
        <div className="home-hero-copy">
          <div className="home-live-pill"><i /> 2,847 jugadores en cola</div>
          <p className="section-kicker">Tu sesión de hoy</p>
          <h1>
            Tu lobby está listo. Falta tu <span>próximo match.</span>
          </h1>
          <p>
            Ajusta tu juego, rol y energía. q2play hace el resto para que llegues a la partida con un equipo que sí encaja.
          </p>
          <div className="home-hero-actions">
            <button onClick={() => onNavigate('buscar')} className="signal-cta">
              <Lightning weight="fill" /> Buscar jugadores <ArrowRight weight="bold" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="ghost-button">
              Ver mi rendimiento
            </button>
          </div>
        </div>

        <div className="home-match-card" aria-label="Actividad reciente de matchmaking">
          <div className="home-match-card-head">
            <span>SEÑAL ACTIVA</span>
            <i />
          </div>
          <div className="home-match-players">
            <span className="home-player home-player-a">LU</span>
            <span className="home-match-link"><b>93%</b><small>afinidad</small></span>
            <span className="home-player home-player-b">MK</span>
          </div>
          <div className="home-match-card-foot">
            <UsersThree weight="duotone" />
            <span><b>Un squad está cerca</b><small>Tiempo estimado: 12 segundos</small></span>
          </div>
        </div>
      </section>

      <section className="feature-ribbon stagger">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="feature-ribbon-item">
            <span className="feature-ribbon-icon"><Icon weight="duotone" /></span>
            <div>
              <p>{title}</p>
              <span lang="es">
              {desc}
              </span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
