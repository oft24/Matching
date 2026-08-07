import { useEffect, useState } from 'react';

const ACCENTS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#f97316', '#64748b'];

/** Iniciales de una a dos letras, como en el diseño (AlexR -> AR, Shadow Fox -> SF). */
export function initialsOf(name: string) {
  const clean = (name ?? '').trim();
  if (!clean) return '?';
  const words = clean.split(/[\s_.-]+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  const caps = clean.match(/[A-ZÁÉÍÓÚÑ]/g);
  if (caps && caps.length > 1) return (caps[0] + caps[1]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

/** Color estable derivado del nombre, para que un mismo jugador siempre se vea igual. */
export function accentOf(name: string) {
  const key = name ?? '';
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

type Status = 'online' | 'ingame' | 'offline';

const STATUS_COLOR: Record<Status, string> = {
  online: '#34d399',
  ingame: '#fbbf24',
  offline: '#64748b',
};

/** Los avatares antiguos de dicebear ya no se usan: se tratan como "sin icono". */
export function isRealAvatar(src?: string | null): src is string {
  return Boolean(src && !src.includes('dicebear'));
}

interface AvatarProps {
  name: string;
  /** Icono de perfil (p. ej. el de LoL al conectar Riot). Si falta o falla, caen las iniciales. */
  src?: string | null;
  /** Lado en píxeles. */
  size?: number;
  /** `true` usa el degradado de marca en vez del color derivado del nombre. */
  brand?: boolean;
  status?: Status;
  radius?: number;
  className?: string;
}

export default function Avatar({ name, src, size = 44, brand = false, status, radius, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const fontSize = Math.max(11, Math.round(size * 0.34));
  const borderRadius = radius ?? Math.round(size * 0.25);
  const showImage = isRealAvatar(src) && !failed;

  useEffect(() => setFailed(false), [src]);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {showImage ? (
        <img
          src={src}
          alt={`Foto de perfil de ${name}`}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          style={{ borderRadius }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="avatar-initials h-full w-full"
          style={{
            borderRadius,
            fontSize,
            ...(brand ? {} : { background: accentOf(name) }),
          }}
        >
          {initialsOf(name)}
        </div>
      )}
      {status && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#101827]"
          style={{ width: Math.max(10, size * 0.26), height: Math.max(10, size * 0.26), background: STATUS_COLOR[status] }}
        />
      )}
    </div>
  );
}
