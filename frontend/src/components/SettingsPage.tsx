import { useEffect, useState } from 'react';
import PageHeader from './PageHeader';
import Toggle from './Toggle';
import DesktopApp from './DesktopApp';
import LegalModal from './LegalModal';
import { useAuth } from '../context/AuthContext';
import { type LegalSection } from '../data/legal';

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
const SETTINGS_KEY = 'q2play_preferences';

function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return {
      settings: { ...INITIAL, ...(saved.settings ?? {}) } as Record<SettingKey, boolean>,
      language: typeof saved.language === 'string' ? saved.language : 'es',
      timezone: typeof saved.timezone === 'string' ? saved.timezone : 'gmt-6',
    };
  } catch {
    return { settings: INITIAL, language: 'es', timezone: 'gmt-6' };
  }
}

export default function SettingsPage() {
  const { deleteAccount } = useAuth();
  const [saved] = useState(readPreferences);
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>(saved.settings);
  const [language, setLanguage] = useState(saved.language);
  const [timezone, setTimezone] = useState(saved.timezone);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalSection, setLegalSection] = useState<LegalSection>('terms');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const set = (key: SettingKey) => (next: boolean) => setSettings((prev) => ({ ...prev, [key]: next }));
  const showLegal = (section: LegalSection) => { setLegalSection(section); setLegalOpen(true); };

  const removeAccount = async () => {
    if (!window.confirm('¿Eliminar tu cuenta de q2play? Se borrarán perfil, conexiones, amistades, mensajes y matches. Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    setDeleteError('');
    try { await deleteAccount(); }
    catch { setDeleteError('No pudimos eliminar la cuenta. Intenta de nuevo.'); setDeleting(false); }
  };

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ settings, language, timezone }));
  }, [language, settings, timezone]);

  return (
    <section className="mx-auto mb-8 max-w-4xl">
      <PageHeader kicker="TU CUENTA" title="Ajustes" description="Personaliza cómo funciona q2play para ti." />

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

        <DesktopApp />

        <Card title="Legal y seguridad" subtitle="Consulta los acuerdos que protegen cada match.">
          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => showLegal('terms')} className="ghost-button px-4 py-3 text-sm">Términos</button>
            <button type="button" onClick={() => showLegal('privacy')} className="ghost-button px-4 py-3 text-sm">Privacidad</button>
            <button type="button" onClick={() => showLegal('rules')} className="ghost-button px-4 py-3 text-sm">Reglas de comunidad</button>
          </div>
        </Card>

        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-6">
          <h3 className="text-sm font-bold text-red-400">Zona de peligro</h3>
          <p className="mt-1 text-xs text-slate-400">Esta acción no se puede deshacer.</p>
          <button type="button" disabled={deleting} onClick={() => void removeAccount()} className="danger-button mt-4 px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
            {deleting ? 'Eliminando…' : 'Eliminar cuenta'}
          </button>
          {deleteError ? <p className="mt-3 text-sm text-red-300" role="alert">{deleteError}</p> : null}
        </div>
      </div>
      <LegalModal open={legalOpen} section={legalSection} onSectionChange={setLegalSection} onClose={() => setLegalOpen(false)} />
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
