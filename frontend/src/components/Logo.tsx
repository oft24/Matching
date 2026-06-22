interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  return (
    <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" stroke="url(#logoGrad)" strokeWidth="2" fill="rgba(17,24,39,0.8)" />
      <circle cx="24" cy="14" r="5" fill="#7C3AED" />
      <circle cx="13" cy="30" r="5" fill="#3B82F6" />
      <circle cx="35" cy="30" r="5" fill="#3B82F6" />
      <line x1="24" y1="19" x2="13" y2="25" stroke="#7C3AED" strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="19" x2="35" y2="25" stroke="#7C3AED" strokeWidth="1.5" opacity="0.5" />
      <line x1="18" y1="30" x2="30" y2="30" stroke="#3B82F6" strokeWidth="1.5" opacity="0.5" />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
