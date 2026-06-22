import { LogIn, LogOut, Mail, Shield, Trophy, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConnectionSettings from './ConnectionSettings';

interface ProfilePageProps {
  onOpenLogin: () => void;
}

export default function ProfilePage({ onOpenLogin }: ProfilePageProps) {
  const { user, isAuthenticated, logout } = useAuth();

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
            <LogIn className="w-4 h-4" />
            Iniciar sesión
          </button>
          <p className="text-xs text-slate-500 mt-4">
            ¿No tienes cuenta? Usa el botón de arriba y cambia a Registro.
          </p>
        </div>
      </section>
    );
  }

  const avatar = user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`;

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Mi Perfil
      </h3>

      <div className="glass rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <img
            src={avatar}
            alt={user.username}
            className="w-24 h-24 rounded-2xl ring-2 ring-brand-violet/50"
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">{user.username}</h2>
            <p className="text-slate-400 flex items-center justify-center sm:justify-start gap-2 mb-3">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-violet/20 text-brand-violet text-sm font-medium">
                <Trophy className="w-4 h-4" /> Nivel {user.level}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium">
                <Shield className="w-4 h-4" /> {user.xp} XP
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-red-500/30
              text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-white/8">
          <Stat label="Nivel de cuenta" value={String(user.level)} />
          <Stat label="Experiencia" value={`${user.xp} XP`} />
          <Stat label="Estado" value="En línea" accent />
        </div>

        <ConnectionSettings />
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
