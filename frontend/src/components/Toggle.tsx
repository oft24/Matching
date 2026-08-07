interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

/** Conmutador animado del diseño: pista que cambia de color y perilla que se desliza. */
export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`toggle ${checked ? 'toggle-on' : ''}`}
    />
  );
}
