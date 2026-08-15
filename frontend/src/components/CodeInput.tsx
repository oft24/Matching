import { useEffect, useRef } from 'react';

export const CODE_LENGTH = 6;

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** `modal` usa los tonos del LoginModal; `nocturne` los tokens de la pantalla previa. */
  variant?: 'modal' | 'nocturne';
}

const BOX_STYLES: Record<'modal' | 'nocturne', string> = {
  modal:
    'h-14 w-full rounded-lg border border-white/10 bg-[#0b1220] text-center text-xl font-semibold text-white transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 disabled:opacity-50',
  nocturne:
    'nocturne-input h-12 text-center text-lg font-semibold disabled:opacity-50',
};

/**
 * Seis casillas para el código de verificación. Acepta pegar el código completo
 * en cualquier casilla y navegar con flechas o borrado.
 */
export default function CodeInput({ value, onChange, disabled, variant = 'modal' }: CodeInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(CODE_LENGTH - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;

    // Un dígito avanza una casilla; un pegado rellena desde la casilla actual.
    const chars = value.padEnd(CODE_LENGTH, ' ').split('');
    for (let i = 0; i < digits.length && index + i < CODE_LENGTH; i += 1) {
      chars[index + i] = digits[i];
    }
    onChange(chars.join('').replace(/ /g, '').slice(0, CODE_LENGTH));
    focusAt(index + digits.length);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = value.padEnd(CODE_LENGTH, ' ').split('');
      const target = chars[index] !== ' ' ? index : index - 1;
      if (target < 0) return;
      chars[target] = ' ';
      onChange(chars.join('').replace(/ /g, ''));
      focusAt(target);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={CODE_LENGTH}
          value={value[i] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Dígito ${i + 1}`}
          className={BOX_STYLES[variant]}
        />
      ))}
    </div>
  );
}
