'use client';

import React, { memo, useMemo } from 'react';

interface AppLogoProps {
  src?: string; // kept for API compatibility but unused
  iconName?: string; // kept for API compatibility but unused
  size?: number; // Size in pixels
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
}

const AppLogo = memo(function AppLogo({
  size = 64,
  className = '',
  onClick,
}: AppLogoProps) {
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick}>
      <span
        style={{ fontSize: size, lineHeight: 1, color: '#d4af37' }}
        className="flex-shrink-0 select-none"
        role="img"
        aria-label="Pawn"
      >
        ♟
      </span>
    </div>
  );
});

export default AppLogo;
