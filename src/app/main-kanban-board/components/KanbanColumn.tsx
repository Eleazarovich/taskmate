'use client';
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Task, Stage } from '@/lib/types';
import { STAGE_CONFIG } from '@/lib/types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  stage: Stage;
  tasks: Task[];
  dropState: 'valid' | 'invalid' | 'none';
  isOver: boolean;
  onTaskClick: (task: Task) => void;
  onAddTask?: () => void;
  snapBackId: string | null;
}

const columnBorderColors: Record<Stage, string> = {
  pawn:   'border-pawn/20   hover:border-pawn/40',
  knight: 'border-knight/20 hover:border-knight/40',
  bishop: 'border-bishop/20 hover:border-bishop/40',
  rook:   'border-rook/20   hover:border-rook/40',
  queen:  'border-queen/20  hover:border-queen/40',
  king:   'border-king/20   hover:border-king/40',
};

const columnGlowColors: Record<Stage, string> = {
  pawn:   'shadow-[0_0_20px_rgba(107,114,128,0.15)]',
  knight: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  bishop: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
  rook:   'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  queen:  'shadow-[0_0_20px_rgba(236,72,153,0.15)]',
  king:   'shadow-[0_0_20px_rgba(212,175,55,0.2)]',
};

export default function KanbanColumn({
  stage,
  tasks,
  dropState,
  isOver,
  onTaskClick,
  onAddTask,
  snapBackId,
}: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage];
  const { setNodeRef } = useDroppable({ id: stage });

  const dropOverlayClass = dropState === 'valid' && isOver ?'drag-over-valid'
    : dropState === 'invalid'&& isOver ?'drag-over-invalid' :'';

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl border bg-card/40 transition-all duration-200 ${columnBorderColors[stage]} ${isOver && dropState !== 'none' ? columnGlowColors[stage] : ''}`}
    >
      {/* Column header */}
      <div className={`p-3 border-b border-border/50 bg-stage-${stage} rounded-t-xl`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`text-2xl stage-${stage} leading-none`}>{config.glyph}</span>
            <div>
              <div className={`text-xs font-bold tracking-widest uppercase stage-${stage} font-mono`}>
                {config.label}
              </div>
              <div className="text-xs text-muted-foreground">{config.kanbanLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-semibold stage-${stage} px-1.5 py-0.5 rounded bg-stage-${stage}`}>
              {tasks.length}
            </span>
            {onAddTask && (
              <button
                onClick={onAddTask}
                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150"
                aria-label="Add task to Pawn"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto scrollbar-game min-h-[120px] rounded-b-xl transition-all duration-150 ${dropOverlayClass}`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={`task-card-${task.id}`}
              task={task}
              isDragging={false}
              isSnapBack={snapBackId === task.id}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className={`text-3xl opacity-20 stage-${stage}`}>{config.glyph}</span>
            <p className="text-xs text-muted-foreground mt-2">No {config.kanbanLabel} tasks</p>
            {stage === 'pawn' && (
              <button
                onClick={onAddTask}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Add a task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}