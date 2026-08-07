import { useState } from 'react';
import PageHeader from './PageHeader';
import Toggle from './Toggle';

const NOTIFICATIONS = [
  { key: 'notifMatches', label: 'Nuevos matches', desc: 'Cuando encontramos un jugador compatible' },
  { key: 'notifMessages', label: 'Mensajes directos', desc: 'Nuevos mensajes de amigos y matches' },
  { key: 'notifRequests', label: 'Solicitudes de amistad', desc: 'Cuando alguien quiere agregarte' },
  { key: 'notifDigest', label: 'Resumen semanal', desc: 'Un correo con tu actividad de la semana' },
] as const;

const PRIVACY = [
  { key: 'privacyOnline', label: 'Mostrar estado en línea', desc: 'Otros jugadores verán cuando estás activo' },
  { key: 'privacyVisible', label: 'Perfil visible en búsqueda', desc: 'Apareces en resultados de otros jugadores' },
  { key: 'privacyRequests', label: 'Solicitudes de cualquiera', desc: 'Permitir solicitudes de amistad sin filtro' },
] as const;

type SettingKey = (typeof NOTIFICATIONS)[number]['key'] | (typeof PRIVACY)[number]['key'];

const INITIAL: Record<SettingKey, boolean> = {
  notifMatches: true,
  notifMessages: true,
  notifRequests: true,
  notifDigest: true,
  privacyOnline: true,
  privacyVisible: true,
  privacyRequests: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>(INITIAL);
  const [language, setLanguage] = useState('es');
  const [timezone, setTimezone] = useState('gmt-6');

  const set = (key: SettingKey) => (next: boolean) => setSettings((prev) => ({ ...prev, [key]: next }));

  return (
    <section className="mx-auto mb-8 max-w-4xl">
      <PageHeader kicker="TU CUENTA" title="Ajustes" description="Personaliza cómo funciona Matching para ti." />

      <div className="stagger space-y-4">
        <Card title="Notificaciones" subtitle="Elige qué quieres que te avisemos.">
          {NOTIFICATIONS.map((item) => (
            <Row key={item.key} label={item.label} desc={item.desc}>
              <Toggle checked={settings[item.key]} onChange={set(item.key)} label={item.label} />
            </Row>
          ))}
        </Card>

        <Card title="Privacidad" subtitle="Controla qué puede ver la comunidad.">
          {PRIVACY.map((item) => (
            <Row key={item.key} label={item.label} desc={item.desc}>
              <Toggle checked={settings[item.key]} onChange={set(item.key)} label={item.label} />
            </Row>
          ))}
        </Card>

        <Card title="Preferencias">
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-slate-400">Idioma</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2.5 text-sm text-white transition-colors focus:border-brand-violet/60 focus:outline-none"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-slate-400">Zona horaria</span>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2.5 text-sm text-white transition-colors focus:border-brand-violet/60 focus:outline-none"
              >
                <option value="gmt-6">GMT-6 (CDMX)</option>
                <option value="gmt-5">GMT-5 (Bogotá/Lima)</option>
                <option value="gmt-3">GMT-3 (Buenos Aires)</option>
              </select>
            </label>
          </div>
        </Card>

        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-6">
          <h3 className="text-sm font-bold text-red-400">Zona de peligro</h3>
          <p className="mt-1 text-xs text-slate-400">Esta acción no se puede deshacer.</p>
          <button className="danger-button mt-4 px-5 py-2.5 text-sm font-semibold">Eliminar cuenta</button>
        </div>
      </div>
    </section>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="surface rounded-2xl p-6">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] py-3">
      <div className="min-w-0">
        <p className="text-sm text-white">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}
