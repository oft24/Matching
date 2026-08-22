import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChatCircle, DiscordLogo, GameController, LinkSimple, LockKey, ShieldCheck, UsersThree } from '@phosphor-icons/react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import type { QueueStatus } from '../types';
import { DEFAULT_GAMES } from '../data/games';

/** Con qué intención salió el usuario de la celebración. */
export type MatchIntent = 'message' | 'dismiss';

interface MatchFoundOverlayProps {
  status: QueueStatus;
  /** Se llama una sola vez, cuando la animación de salida ha terminado. */
  onClose: (intent: MatchIntent) => void;
}

/** Chispas del momento de impacto: pocas y con recorrido fijo, no confeti. */
const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { dx: `${Math.cos(angle) * 78}px`, dy: `${Math.sin(angle) * 78}px`, delay: `${i * 24}ms` };
});

/** Antes de esto la escena aún se está montando: cerrar cortaría la animación. */
const LOCK_MS = 900;
/** Lo que tarda la salida en verse completa antes de desmontar. */
const EXIT_MS = 220;

/** En pantallas bajas (móvil apaisado) la escena se compacta en vez de recortarse. */
function useCompactScene() {
  const query = '(max-height: 640px)';
  const [compact, setCompact] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return compact;
}

export default function MatchFoundOverlay({ status, onClose }: MatchFoundOverlayProps) {
  const { user } = useAuth();
  const opponent = status.opponent;
  const compact = useCompactScene();
  const [closing, setClosing] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstCtaRef = useRef<HTMLButtonElement>(null);
  const exitRef = useRef<number | null>(null);
  const intentRef = useRef<MatchIntent>('dismiss');

  const close = useCallback((intent: MatchIntent) => {
    if (exitRef.current) return; // una salida, no dos: Escape + clic fuera no deben sumarse
    intentRef.current = intent;
    setClosing(true);
    exitRef.current = window.setTimeout(() => onClose(intent), EXIT_MS);
  }, [onClose]);

  // El usuario toma el control cuando la narrativa ha terminado de contarse.
  // Sin animación no hay narrativa que esperar: el control llega de inmediato.
  useEffect(() => {
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setInteractive(true), sinMovimiento ? 0 : LOCK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // El foco entra cuando el botón ya está habilitado: uno deshabilitado no lo acepta
  useEffect(() => { if (interactive) firstCtaRef.current?.focus(); }, [interactive]);

  // Al cerrar, el teclado vuelve donde estaba y no al principio de la página.
  // Si el usuario eligió escribir, el foco es del chat: aquí no se toca.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => {
      if (intentRef.current === 'message') return;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  // Si el componente se va antes de tiempo, el temporizador de salida se va con él
  useEffect(() => () => { if (exitRef.current) window.clearTimeout(exitRef.current); }, []);

  // Bloqueo de scroll, restaurado exactamente como estaba
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  // Escape para salir y foco atrapado dentro del panel mientras está abierto
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && interactive) { close('dismiss'); return; }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href]');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [interactive, close]);

  if (!opponent) return null;

  const yo = user?.username ?? 'Tú';
  const avatarSize = compact ? 92 : 116;
  const heroHeight = compact ? 118 : 150;
  const game = DEFAULT_GAMES.find((item) => item.id === status.game);
  const openDiscord = () => {
    if (!status.discordInviteUrl) return;
    window.open(status.discordInviteUrl, '_blank', 'noopener,noreferrer');
    close('dismiss');
  };

  // Fuera del árbol de la página: `.page-view` conserva un transform de entrada
  // y ancharía este `fixed` a la columna de contenido en vez de a la ventana.
  // `overflow-x-hidden`: los perfiles entran desde fuera de la pantalla y ese
  // recorrido dejaría scroll lateral en móviles estrechos.
  return createPortal(
    <div
      className={`fixed inset-0 z-[120] overflow-y-auto overflow-x-hidden overscroll-contain ${closing ? 'mf-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mf-title"
    >
      <div
        className="mf-veil fixed inset-0 bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] backdrop-blur-md"
        onClick={() => interactive && close('dismiss')}
        aria-hidden="true"
      />
      {/* Foco de luz: la única presencia saturada de la escena */}
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{ background: 'radial-gradient(52% 42% at 50% 42%, color-mix(in srgb, var(--color-accent) 24%, transparent), transparent 70%)' }}
        aria-hidden="true"
      />
      <div className="mf-grid pointer-events-none fixed inset-0" aria-hidden="true" />
      <span className="mf-energy-lane mf-energy-lane-a" aria-hidden="true" />
      <span className="mf-energy-lane mf-energy-lane-b" aria-hidden="true" />

      {/* El envoltorio no intercepta el clic fuera: sólo el panel recibe puntero */}
      <div
        className="pointer-events-none relative flex min-h-full items-center justify-center px-4"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div ref={panelRef} className="pointer-events-auto w-full max-w-lg text-center">
          <p className="sr-only" role="status">
            Match confirmado con {opponent.username}. Puedes enviarle un mensaje
            {status.discordInviteUrl ? ', entrar al canal de voz' : ''} o seguir explorando.
          </p>

          <div className="mf-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent-200)]">
            {game ? <GameController weight="fill" className="h-3.5 w-3.5" /> : <LinkSimple weight="bold" className="h-3.5 w-3.5" />}
            {game?.name ?? 'Conexión confirmada'}
          </div>

          {/* El ancho sigue al tamaño del avatar: la separación entre los dos
              perfiles se mantiene igual al compactar la escena. */}
          <div
            className={`relative mx-auto w-full ${compact ? 'mb-5' : 'mb-8'}`}
            style={{ height: heroHeight, maxWidth: avatarSize * 2 + 68 }}
          >
            <div className="mf-card-a absolute left-2 top-2 sm:left-6">
              <Avatar name={yo} src={user?.avatar} size={avatarSize} radius={16} brand className="shadow-[0_18px_40px_rgba(0,0,0,0.55)] ring-1 ring-[var(--color-accent)]/35" />
            </div>
            <div className="mf-card-b absolute right-2 top-2 sm:right-6">
              <Avatar name={opponent.username} src={opponent.avatar} size={avatarSize} radius={16} brand className="shadow-[0_18px_40px_rgba(0,0,0,0.55)] ring-1 ring-[var(--color-accent)]/35" />
            </div>

            <span className="mf-connection-line" aria-hidden="true"><i /></span>

            {/* Impacto: la marca de conexión, con ondas y chispas */}
            <div className="pointer-events-none absolute left-1/2 z-10" style={{ top: avatarSize / 2 + 8 }} aria-hidden="true">
              <span className="mf-ring absolute left-1/2 top-1/2 h-16 w-16 rounded-full border border-[var(--color-accent)]" />
              <span className="mf-ring mf-ring-2 absolute left-1/2 top-1/2 h-16 w-16 rounded-full border border-[var(--color-accent)]" />
              {SPARKS.map((s, i) => (
                <span
                  key={i}
                  className="mf-spark absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[var(--color-accent-200)]"
                  style={{ ['--dx' as string]: s.dx, ['--dy' as string]: s.dy, animationDelay: `calc(560ms + ${s.delay})` }}
                />
              ))}
              <span className="mf-impact absolute left-1/2 top-1/2 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-bg)] text-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent),0_0_34px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]">
                <LinkSimple weight="bold" className="h-7 w-7" />
              </span>
            </div>
          </div>

          <h2
            id="mf-title"
            className={`mf-title leading-none text-[var(--color-text)] ${compact ? 'text-[clamp(24px,6vw,30px)]' : 'text-[clamp(30px,7vw,40px)]'}`}
          >
            Hicieron match
          </h2>
          <p className={`mf-sub text-[15px] text-[color-mix(in_srgb,var(--color-text)_66%,transparent)] ${compact ? 'mt-2' : 'mt-3'}`}>
            A {opponent.username} también le interesó jugar contigo.
          </p>
          {status.compatibility != null && (
            <div className="mf-compat mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" />
              <b className="text-white">{status.compatibility}%</b> de compatibilidad
            </div>
          )}

          <section className="mf-room-card" aria-label="Espacio privado del match">
            <div className="mf-room-icon"><LockKey weight="fill" /></div>
            <div className="min-w-0 text-left">
              <span className="mf-room-state"><i /> Match privado activo</span>
              <strong>{status.discordInviteUrl ? 'Sala de voz para ustedes dos' : 'Chat directo para ustedes dos'}</strong>
              <p>{status.discordInviteUrl ? 'La invitación abre una sala temporal con límite de 2 personas.' : 'Conecten Discord desde Ajustes para habilitar voz privada en el siguiente match.'}</p>
            </div>
          </section>

          <div className="mf-trust-row" aria-label="Protecciones del match">
            <span><UsersThree weight="fill" /> Sólo 2 jugadores</span>
            <span><ShieldCheck weight="fill" /> Consentimiento mutuo</span>
          </div>

          <div className={`flex flex-col items-stretch gap-2.5 sm:mx-auto sm:max-w-[320px] ${compact ? 'mt-5' : 'mt-8'}`}>
            <button
              ref={firstCtaRef}
              onClick={() => close('message')}
              disabled={!interactive}
              className="mf-cta-1 primary-button min-h-[44px] whitespace-nowrap px-5 text-sm disabled:opacity-45"
            >
              <ChatCircle className="h-[18px] w-[18px]" /> Enviar mensaje
            </button>
            {status.discordInviteUrl && (
              <button
                type="button"
                onClick={openDiscord}
                disabled={!interactive}
                className="mf-cta-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#5865F2]/45 bg-[#5865F2]/15 px-5 text-sm font-semibold text-[#cdd2ff] transition-colors hover:bg-[#5865F2]/25 disabled:opacity-45"
              >
                <DiscordLogo weight="fill" className="h-[18px] w-[18px]" /> Abrir mi sala privada
              </button>
            )}
            <button
              onClick={() => close('dismiss')}
              disabled={!interactive}
              className="mf-cta-2 ghost-button inline-flex min-h-[40px] items-center justify-center gap-2 whitespace-nowrap px-5 text-sm disabled:opacity-45"
            >
              Seguir explorando <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
