export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9 20.5L16 9L23 20.5"
        stroke="var(--primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="20.5" r="2.1" className="fill-primary-foreground" />
      <circle cx="9" cy="20.5" r="1.6" className="fill-primary-foreground" opacity="0.55" />
      <circle cx="23" cy="20.5" r="1.6" className="fill-primary-foreground" opacity="0.55" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        钱包智能提取器
      </span>
    </div>
  );
}
