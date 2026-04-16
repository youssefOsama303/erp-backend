import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="NEXUS ERP">
      <defs>
        <linearGradient id="nexusG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#nexusG)" />
      <path
        d="M20 40V24a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2Zm9 0V30a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2Zm9 0V20a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2Z"
        fill="rgba(255,255,255,0.92)"
      />
    </svg>
  );
}

