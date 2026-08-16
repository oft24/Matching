import { CheckCircle } from '@phosphor-icons/react';
import Logo from './Logo';
import MatchingStage from './MatchingStage';
import GoogleSignInButton from './GoogleSignInButton';

const PERKS = [
  'Sin contraseñas que recordar ni códigos que esperar',
  'Tu correo queda verificado desde el primer momento',
  'Enlaza Riot y Discord cuando quieras, no antes',
];

/**
 * Pantalla previa al login: propuesta de valor y acceso a la izquierda,
 * animación del emparejamiento a la derecha. El acceso habla con la API real
 * de la app — no es una demostración.
 */
export default function PreLogin() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 px-6 py-4 sm:px-10">
        <div className="mr-auto flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-lg font-medium text-[var(--color-text)]">Matching</span>
          <span className="rounded-md border border-[var(--color-accent)] px-2 py-0.5 text-[11px] text-[var(--color-accent)]">
            BETA
          </span>
        </div>
        <span className="hidden text-[13px] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)] sm:block">
          Juega. Conecta.
        </span>
      </header>

      <main className="grid flex-1 items-center gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-2">
        <section className="anim-fade-up max-w-[520px]">
          <p className="section-kicker">Matchmaking para gamers</p>
          <h1 className="mt-3 text-[clamp(32px,3.3vw,46px)] leading-[1.08] text-balance text-[var(--color-text)]">
            Encuentra jugadores. Forma tu equipo. Empieza a ganar.
          </h1>
          <p className="mt-4 max-w-[46ch] text-base text-[color-mix(in_srgb,var(--color-text)_68%,transparent)]">
            Conecta con jugadores que comparten tu juego, rango, rol, plataforma y estilo de juego.
          </p>

          <div className="surface mt-8 rounded-[var(--radius-lg)] p-6">
            <h2 className="text-lg text-[var(--color-text)]">Entra con Google</h2>
            <p className="mt-1 text-[13px] text-[color-mix(in_srgb,var(--color-text)_65%,transparent)]">
              Un solo paso: si es tu primera vez, la cuenta se crea sola.
            </p>

            <div className="my-6 flex justify-center">
              <GoogleSignInButton theme="light" />
            </div>

            <ul className="flex flex-col gap-2">
              {PERKS.map((perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-2 text-[13px] text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-col items-center gap-3">
          <MatchingStage />
          <p className="text-[11px] uppercase tracking-[0.06em] text-[color-mix(in_srgb,var(--color-text)_42%,transparent)]">
            Vista de demostración del emparejamiento
          </p>
        </section>
      </main>
    </div>
  );
}
