import { useEffect, useState } from 'react';
import { EnvelopeSimple, FloppyDisk, Shield, SignIn, SignOut, Trophy, User } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import AvatarPicker from './AvatarPicker';
import PageHeader from './PageHeader';
import ConnectionSettings from './ConnectionSettings';
import { saveProfile } from '../lib/api';

interface ProfilePageProps {
  onOpenLogin: () => void;
}

export default function ProfilePage({ onOpenLogin }: ProfilePageProps) {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [gender, setGender] = useState<'man' | 'woman' | 'other' | ''>('');
  const [saving, setSaving] = useState(false);
  useEffect(() => setGender(user?.gender ?? ''), [user?.gender]);

  if (!isAuthenticated || !user) {
    return (
      <section className="mb-8">
        <div className="glass rounded-2xl p-8 lg:p-12 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-brand-violet/20 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-brand-violet" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Mi Perfil</h2>
          <p className="text-slate-400 mb-8">
            Inicia sesión para ver tu perfil, nivel, estadísticas y gestionar tu cuenta.
          </p>
          <button
            onClick={onOpenLogin}
            className="gradient-btn inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-bold text-sm"
          >
            <SignIn className="w-4 h-4" />
            Iniciar sesión
          </button>
          <p className="text-xs text-slate-500 mt-4">
            ¿No tienes cuenta? Usa el botón de arriba y cambia a Registro.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mb-8 max-w-5xl">
      <PageHeader kicker="MI PERFIL" title={user.username} description={user.email} />

      <div className="glass anim-fade-up rounded-2xl p-6 lg:p-8" style={{ animationDelay: '60ms' }}>
        <div className="mb-7 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Avatar name={user.username} src={user.avatar} size={88} brand radius={20} />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="mb-1.5 text-2xl font-bold text-white">{user.username}</h2>
            <p className="mb-3 flex items-center justify-center gap-2 text-sm text-slate-400 sm:justify-start">
              <EnvelopeSimple className="h-4 w-4" /> {user.email}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-violet/[0.16] px-3 py-1.5 text-xs font-semibold text-violet-300">
                <Trophy className="h-3.5 w-3.5" /> Nivel {user.level}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <Shield className="h-3.5 w-3.5" /> {user.xp} XP
              </span>
            </div>
          </div>

          <button onClick={logout} className="danger-button flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">
            <SignOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>

        <div className="stagger grid gap-3.5 border-t border-white/[0.08] pt-6 sm:grid-cols-3">
          <Stat label="Nivel de cuenta" value={String(user.level)} />
          <Stat label="Experiencia" value={`${user.xp} XP`} />
          <Stat label="Estado" value="En línea" accent />
        </div>

        <div className="pt-6 mt-6 border-t border-white/8 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-2">Soy</label>
            <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className="w-full glass rounded-xl px-3 py-2.5 text-white border border-white/10 focus:outline-none">
              <option value="" className="bg-brand-dark">Prefiero no decirlo</option>
              <option value="man" className="bg-brand-dark">Hombre</option>
              <option value="woman" className="bg-brand-dark">Mujer</option>
              <option value="other" className="bg-brand-dark">Otro</option>
            </select>
          </div>
          <button disabled={saving} onClick={async () => { setSaving(true); try { updateUser(await saveProfile(gender || null)); } finally { setSaving(false); } }} className="gradient-btn px-5 py-2.5 rounded-xl text-white font-semibold inline-flex justify-center items-center gap-2 disabled:opacity-50"><FloppyDisk className="w-4 h-4" />Guardar perfil</button>
        </div>

        <AvatarPicker />

        <ConnectionSettings />
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface-soft card-lift rounded-2xl p-4 text-center">
      <p className="mb-1.5 text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
