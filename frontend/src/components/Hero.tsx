import { Users, Handshake, Target } from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Juega en equipo', desc: 'Forma squads con jugadores compatibles' },
  { icon: Handshake, title: 'Haz nuevos amigos', desc: 'Conecta con tu comunidad gaming' },
  { icon: Target, title: 'Alcanza tus metas', desc: 'Sube de rango junto a tu equipo' },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl glass p-6 lg:p-10 mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/10 via-transparent to-brand-blue/10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-violet/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            Encuentra tu{' '}
            <span className="gradient-text">equipo ideal</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-lg">
            Conecta con jugadores que comparten tus objetivos, rango y estilo de juego.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass rounded-2xl p-4 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-violet/20 flex items-center justify-center mb-3 group-hover:glow-violet transition-shadow">
                  <Icon className="w-5 h-5 text-brand-violet" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex justify-center items-center">
          <div className="relative animate-float">
            <div className="w-72 h-72 rounded-2xl bg-gradient-to-br from-brand-violet/20 to-brand-blue/20 border border-white/10 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 300 300" className="w-full h-full" fill="none">
                <circle cx="150" cy="150" r="120" fill="url(#heroGrad)" opacity="0.15" />
                <circle cx="150" cy="90" r="30" fill="#7C3AED" opacity="0.8" />
                <circle cx="90" cy="190" r="28" fill="#3B82F6" opacity="0.8" />
                <circle cx="210" cy="190" r="28" fill="#3B82F6" opacity="0.8" />
                <line x1="150" y1="120" x2="90" y2="162" stroke="#7C3AED" strokeWidth="2" opacity="0.4" />
                <line x1="150" y1="120" x2="210" y2="162" stroke="#7C3AED" strokeWidth="2" opacity="0.4" />
                <line x1="118" y1="190" x2="182" y2="190" stroke="#3B82F6" strokeWidth="2" opacity="0.4" />
                <path d="M120 210 Q150 240 180 210" stroke="#7C3AED" strokeWidth="2" fill="none" opacity="0.3" />
                <rect x="60" y="60" width="40" height="50" rx="8" fill="#7C3AED" opacity="0.2" transform="rotate(-15 80 85)" />
                <rect x="200" y="50" width="35" height="45" rx="8" fill="#3B82F6" opacity="0.2" transform="rotate(10 217 72)" />
                <circle cx="150" cy="150" r="80" stroke="url(#heroGrad)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                <defs>
                  <radialGradient id="heroGrad">
                    <stop stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#3B82F6" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <div className="absolute -bottom-3 -right-3 glass rounded-2xl px-4 py-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-violet" />
              <span className="text-sm font-medium text-white">+2,400 jugadores activos</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
