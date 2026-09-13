'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Trash2, Calendar, Tag, AlignLeft, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { chessService } from '@/lib/services';
import type { Task, Priority } from '@/lib/types';
import { STAGE_CONFIG } from '@/lib/types';
import StageBadge from '@/components/ui/StageBadge';

import ConfirmModal from '@/components/ui/ConfirmModal';

interface EditTaskModalProps {
  task: Task;
  onSaved: (task: Task) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}

interface FormData {
  title: string;
  description: string;
  priority: Priority | '';
  dueDate: string;
  tagsRaw: string;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

export default function EditTaskModal({ task, onSaved, onDeleted, onClose }: EditTaskModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    defaultValues: {
      title: task.title,
      description: task.description || '',
      priority: task.priority || '',
      dueDate: task.dueDate || '',
      tagsRaw: task.tags.join(', '),
    },
  });

  const onSubmit = async (data: FormData) => {
    const tags = data.tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    try {
      const updated = await chessService.updateTask(task.id, {
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        priority: data.priority as Priority || undefined,
        dueDate: data.dueDate || undefined,
        tags,
      });
      toast.success('Task updated successfully');
      onSaved(updated);
    } catch {
      toast.error('Failed to save task changes.');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await chessService.deleteTask(task.id);
      toast.success('Task removed from board');
      onDeleted(task.id);
    } catch {
      toast.error('Failed to delete task.');
      setIsDeleting(false);
    }
  };

  const stageConfig = STAGE_CONFIG[task.stage];
  const createdDate = new Date(task.createdAt);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const createdLabel = `${months[createdDate.getMonth()]} ${createdDate.getDate()}, ${createdDate.getFullYear()}`;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="card-elevated w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-scale"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-task-title"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl leading-none flex-shrink-0">{stageConfig.glyph}</span>
              <div className="min-w-0">
                <StageBadge stage={task.stage} size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all duration-150"
                aria-label="Delete task — this cannot be undone"
                title="Delete task — this cannot be undone">
                <Trash2 size={15} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto scrollbar-game">
            <form id="edit-task-form" onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5" noValidate>
              {/* Title */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium mb-1.5">
                  Task title <span className="text-danger">*</span>
                </label>
                <input
                  id="edit-title"
                  type="text"
                  className={`w-full bg-input border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                    errors.title ? 'border-danger' : 'border-border focus:border-primary'
                  }`}
                  {...register('title', {
                    required: 'Title is required',
                    minLength: { value: 2, message: 'Title must be at least 2 characters' },
                    maxLength: { value: 120, message: 'Title must be under 120 characters' },
                  })}
                />
                {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium mb-1.5">
                  <span className="flex items-center gap-1.5"><AlignLeft size={13} /> Description</span>
                </label>
                <p className="text-xs text-muted-foreground mb-1.5">Optional — add context, links, or notes</p>
                <textarea
                  id="edit-description"
                  rows={3}
                  placeholder="Add more details about this task..."
                  className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all resize-none"
                  {...register('description')}
                />
              </div>

              {/* Priority + Due date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-priority" className="block text-sm font-medium mb-1.5">
                    <span className="flex items-center gap-1.5"><Flag size={13} /> Priority</span>
                  </label>
                  <select
                    id="edit-priority"
                    className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                    {...register('priority')}
                  >
                    <option value="">No priority</option>
                    {PRIORITIES.map(p => (
                      <option key={`priority-opt-${p}`} value={p} className="capitalize">
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-due-date" className="block text-sm font-medium mb-1.5">
                    <span className="flex items-center gap-1.5"><Calendar size={13} /> Due date</span>
                  </label>
                  <input
                    id="edit-due-date"
                    type="date"
                    className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                    {...register('dueDate')}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="edit-tags" className="block text-sm font-medium mb-1.5">
                  <span className="flex items-center gap-1.5"><Tag size={13} /> Tags</span>
                </label>
                <p className="text-xs text-muted-foreground mb-1.5">Comma-separated — e.g. MVP, Testing, Bug, Urgent</p>
                <input
                  id="edit-tags"
                  type="text"
                  placeholder="MVP, Testing, Bug"
                  className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                  {...register('tagsRaw')}
                />
              </div>

              {/* Read-only metadata */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-mono text-secondary-foreground">{createdLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Current stage</span>
                  <StageBadge stage={task.stage} size="sm" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Task ID</span>
                  <span className="font-mono text-muted-foreground">{task.id}</span>
                </div>
              </div>
            </form>
          </div>

          {/* Sticky footer */}
          <div className="flex items-center justify-between gap-3 p-5 border-t border-border bg-card rounded-b-xl">
            {isDirty && (
              <p className="text-xs text-warning flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
                Unsaved changes
              </p>
            )}
            {!isDirty && <div />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-secondary-foreground border border-border rounded-lg hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-task-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : null}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Remove task"
        message="Remove this task from the board? This cannot be undone."
        confirmLabel={isDeleting ? 'Removing...' : 'Remove Task'}
        cancelLabel="Keep Task"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
