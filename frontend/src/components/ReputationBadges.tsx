import { Shield, Star, Handshake, Target } from 'lucide-react';

const BADGE_MAP: Record<string, { icon: typeof Shield; label: string; color: string }> = {
  verified: { icon: Shield, label: 'Perfil verificado', color: 'text-emerald-400' },
  'good-teammate': { icon: Handshake, label: 'Buen compañero', color: 'text-brand-violet' },
  active: { icon: Target, label: 'Jugador activo', color: 'text-brand-blue' },
};

interface ReputationBadgesProps {
  reputation: number;
  badges: string[];
  compact?: boolean;
}

export default function ReputationBadges({ reputation, badges, compact }: ReputationBadgesProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <Star className="w-3 h-3 fill-amber-400" />
          {reputation.toFixed(1)}
        </span>
        {badges.map((b) => {
          const info = BADGE_MAP[b];
          if (!info) return null;
          const Icon = info.icon;
          return (
            <span key={b} title={info.label}>
              <Icon className={`w-3.5 h-3.5 ${info.color}`} />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-medium">
        <Star className="w-3.5 h-3.5 fill-amber-400" />
        Reputación {reputation.toFixed(1)}
      </span>
      {badges.map((b) => {
        const info = BADGE_MAP[b];
        if (!info) return null;
        const Icon = info.icon;
        return (
          <span key={b} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 text-xs font-medium ${info.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {info.label}
          </span>
        );
      })}
    </div>
  );
}
