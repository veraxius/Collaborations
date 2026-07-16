type IconProps = {
  size?: number;
  className?: string;
};

/** Shield + checkmark brand icon, flat, single accent color. */
export function LogoIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 1.5 L21 4.8 V11 C21 16.6 17.2 20.9 12 22.8 C6.8 20.9 3 16.6 3 11 V4.8 Z"
        fill="#0071E3"
      />
      <path
        d="M7.6 11.8 L10.6 14.8 L16.4 8.6"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Horizontal lockup: icon + wordmark. */
export function Logo({ size = 24, className }: IconProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoIcon size={size} />
      <span className="font-semibold tracking-tight text-neutral-900">FleetGuard</span>
    </span>
  );
}
