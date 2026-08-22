import { BellRinging, CheckCircle, DownloadSimple, Monitor, Power, Tray } from '@phosphor-icons/react';

const FEATURES = [
  { icon: Tray, title: 'Vive en la bandeja', desc: 'Se queda en segundo plano al cerrar la ventana, como Discord.' },
  { icon: BellRinging, title: 'Notificaciones nativas', desc: 'Avisos de Windows cuando llega un match o un mensaje.' },
  { icon: Power, title: 'Arranca con Windows', desc: 'Opcional, se activa desde el menú de la bandeja.' },
  { icon: Monitor, title: 'Sesión persistente', desc: 'No vuelve a pedirte credenciales en cada arranque.' },
];

/** Apartado de instalación de la app de escritorio (Electron). */
export default function DesktopApp() {
  const isDesktop = window.q2playDesktop?.isDesktop === true;

  return (
    <div className="surface rounded-[var(--radius-lg)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-[var(--color-text)]">App de escritorio</h3>
          <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-text)_62%,transparent)]">
          q2play para Windows, con bandeja del sistema y notificaciones.
          </p>
        </div>

        {isDesktop ? (
          <span className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
            <CheckCircle className="h-4 w-4" weight="fill" /> Ya la estás usando
          </span>
        ) : (
          <a
            href="https://github.com/oft24/Matching/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button flex items-center gap-2 px-4 py-2 text-sm"
          >
            <DownloadSimple className="h-4 w-4" /> Descargar para Windows
          </a>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[var(--color-accent)]" />
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--color-text)]">{title}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-text)_58%,transparent)]">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!isDesktop && (
        <p className="mt-5 border-t border-[var(--color-neutral-800)] pt-4 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-text)_50%,transparent)]">
          Versión 1.0.0 · instalador de 101 MB para Windows x64. Al no estar firmado con un
          certificado de código, SmartScreen mostrará un aviso la primera vez: pulsa
          «Más información» y «Ejecutar de todas formas».
        </p>
      )}

    </div>
  );
}
