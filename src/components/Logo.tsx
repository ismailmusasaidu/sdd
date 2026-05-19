interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon-only';
}

export default function Logo({ size = 'md', variant = 'full' }: LogoProps) {
  const sizes = {
    sm: { icon: 36, text: 'text-lg' },
    md: { icon: 56, text: 'text-2xl' },
    lg: { icon: 72, text: 'text-4xl' },
  };

  const iconSize = sizes[size].icon;
  const textSize = sizes[size].text;

  return (
    <div className="flex items-center gap-3">
      <img
        src="/image.png"
        alt="Danhausa Services Logo"
        width={iconSize}
        height={iconSize}
        className="flex-shrink-0 object-contain"
      />

      {variant === 'full' && (
        <div className="flex flex-col gap-0">
          <h1 className={`font-bold text-primary-800 ${textSize}`}>
            Danhausa <span className="text-secondary-500">Home</span>
          </h1>
          <p className="text-xs font-semibold text-primary-600 tracking-wide uppercase">Trusted Services</p>
        </div>
      )}
    </div>
  );
}
