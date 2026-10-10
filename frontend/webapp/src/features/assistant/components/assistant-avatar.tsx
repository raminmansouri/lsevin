/** LSevin's assistant mascot: a friendly little guide with a gold spark. */
export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <line x1="24" y1="9" x2="24" y2="5" stroke="#eacb7f" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="4" r="2.6" fill="#eacb7f" />
      <rect x="7" y="9" width="34" height="30" rx="13" fill="#ffffff" />
      <circle cx="14" cy="28" r="2.6" fill="#eacb7f" opacity="0.6" />
      <circle cx="34" cy="28" r="2.6" fill="#eacb7f" opacity="0.6" />
      <ellipse cx="18" cy="22" rx="2.6" ry="3.2" fill="#083f30" />
      <ellipse cx="30" cy="22" rx="2.6" ry="3.2" fill="#083f30" />
      <path d="M18 29 Q24 34.5 30 29" fill="none" stroke="#083f30" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}