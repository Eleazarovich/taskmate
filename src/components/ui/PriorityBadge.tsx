import React from 'react';
import type { Priority } from '@/lib/types';
import { PRIORITY_CONFIG } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

const dotColors: Record<Priority, string> = {
  low: 'bg-muted-foreground',
  medium: 'bg-knight',
  high: 'bg-warning',
  critical: 'bg-danger',
};

export default function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[priority]}`} />
      <span className={config.color}>{config.label}</span>
    </span>
  );
}