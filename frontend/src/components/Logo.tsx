interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  return (
    <span
      className="brand-mark"
      style={{ width: dim, height: dim }}
      aria-hidden="true"
    >
      <span className="brand-mark-link" />
      <span className="brand-mark-node brand-mark-node-a" />
      <span className="brand-mark-node brand-mark-node-b" />
    </span>
  );
}
