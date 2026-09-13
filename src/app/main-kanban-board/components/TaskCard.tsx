'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Tag } from 'lucide-react';
import type { Task } from '@/lib/types';
import PriorityBadge from '@/components/ui/PriorityBadge';

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  isSnapBack: boolean;
  onClick: () => void;
}

function formatDueDate(dueDate: string): { label: string; isOverdue: boolean } {
  const due = new Date(dueDate);
  const now = new Date('2026-09-11');
  const diff = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = diff < 0;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return {
    label: `${months[due.getMonth()]} ${due.getDate()}`,
    isOverdue,
  };
}

export default function TaskCard({ task, isDragging, isSnapBack, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isInvisible = isSortableDragging && !isDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`card-elevated p-3 cursor-grab active:cursor-grabbing group transition-all duration-150 hover:border-border/80 hover:shadow-lg hover:-translate-y-0.5 select-none ${
        isInvisible ? 'opacity-0' : 'opacity-100'
      } ${isSnapBack ? 'snap-back' : ''} ${isDragging ? 'opacity-90' : ''}`}
    >
      {/* Title */}
      <p className="text-sm font-medium text-card-foreground leading-snug mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Priority + Due date row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {task.priority && <PriorityBadge priority={task.priority} />}
        </div>
        {task.dueDate && (() => {
          const { label, isOverdue } = formatDueDate(task.dueDate);
          return (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-danger' : 'text-muted-foreground'}`}>
              <Calendar size={11} />
              <span>{label}</span>
            </div>
          );
        })()}
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          <Tag size={10} className="text-muted-foreground flex-shrink-0" />
          {task.tags.slice(0, 3).map(tag => (
            <span
              key={`tag-${task.id}-${tag}`}
              className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{task.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}