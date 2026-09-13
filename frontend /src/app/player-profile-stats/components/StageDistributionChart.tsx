'use client';
import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import type { Stage } from '@/lib/types';
import { STAGE_CONFIG, STAGES } from '@/lib/types';

interface StageDistributionChartProps {
  tasksByStage: Record<Stage, number>;
}

const STAGE_COLORS: Record<Stage, string> = {
  pawn:   '#6b7280',
  knight: '#3b82f6',
  bishop: '#8b5cf6',
  rook:   '#f59e0b',
  queen:  '#ec4899',
  king:   '#d4af37',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; glyph: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card-elevated px-3 py-2 rounded-lg text-xs shadow-lg">
      <p className="font-medium text-foreground">{d.glyph} {d.name}</p>
      <p className="text-muted-foreground">{d.value} task{d.value !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function StageDistributionChart({ tasksByStage }: StageDistributionChartProps) {
  const data = STAGES.map(stage => ({
    name: STAGE_CONFIG[stage].label,
    glyph: STAGE_CONFIG[stage].glyph,
    value: tasksByStage[stage] || 0,
    fill: STAGE_COLORS[stage],
  })).filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <span className="text-4xl opacity-20">♟</span>
        <p className="text-sm text-muted-foreground mt-2">No tasks yet</p>
        <p className="text-xs text-muted-foreground">Create tasks on your board to see the distribution</p>
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="30%"
          outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            background={{ fill: 'var(--muted)' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-stage-${entry.name}-${index}`} fill={entry.fill} />
            ))}
          </RadialBar>
          <Tooltip content={<CustomTooltip />} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}