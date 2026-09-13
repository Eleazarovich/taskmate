import React from 'react';
import type { Stage } from '@/lib/types';
import { STAGE_CONFIG } from '@/lib/types';

interface StageBadgeProps {
  stage: Stage;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const stageClasses: Record<Stage, string> = {
  pawn:   'stage-pawn   bg-stage-pawn   border border-pawn/30',
  knight: 'stage-knight bg-stage-knight border border-knight/30',
  bishop: 'stage-bishop bg-stage-bishop border border-bishop/30',
  rook:   'stage-rook   bg-stage-rook   border border-rook/30',
  queen:  'stage-queen  bg-stage-queen  border border-queen/30',
  king:   'stage-king   bg-stage-king   border border-king/30',
};

export default function StageBadge({ stage, size = 'md', showLabel = true }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage];
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${stageClasses[stage]}`}>
      <span className={size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}>
        {config.glyph}
      </span>
      {showLabel && <span className="font-mono tracking-wide">{config.label}</span>}
    </span>
  );
}