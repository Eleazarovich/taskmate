'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Trash2, Calendar, Tag, AlignLeft, Flag, Save } from 'lucide-react';
import { toast } from 'sonner';
import { chessService } from '@/lib/services';
import { useAppContext } from '@/lib/store';
import type { Task, Priority, Stage } from '@/lib/types';
import { STAGE_CONFIG, STAGES } from '@/lib/types';
import StageBadge from '@/components/ui/StageBadge';

import ConfirmModal from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import AppLogo from '@/components/ui/AppLogo';

interface FormData {
  title: string;
  description: string;
  priority: Priority | '';
  dueDate: string;
  tagsRaw: string;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

export default function TaskDetailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('id');
  const { user, setUser, tasks, setTasks, updateTask, removeTask } = useAppContext();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>();

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await chessService.getCurrentUser();
        if (!currentUser) { router.push('/'); return; }
        setUser(currentUser);

        if (taskId) {
          // The service contract has no standalone task lookup endpoint, so
          // locate the task through the authenticated board task lists.
          const boards = await chessService.getBoards();
          let found: Task | null = null;
          for (const board of boards) {
            const boardTasks = await chessService.getTasksByBoard(board.id);
            found = boardTasks.find(t => t.id === taskId) || null;
            if (found) break;
          }
          if (found) {
            setTask(found);
            reset({
              title: found.title,
              description: found.description || '',
              priority: found.priority || '',
              dueDate: found.dueDate || '',
              tagsRaw: found.tags.join(', '),
            });
          }
        }
      } catch {
        toast.error('Failed to load task.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [taskId, router, setUser, reset]);

  const onSubmit = async (data: FormData) => {
    if (!task) return;
    const tags = data.tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const updated = await chessService.updateTask(task.id, {
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        priority: data.priority as Priority || undefined,
        dueDate: data.dueDate || undefined,
        tags,
      });
      setTask(updated);
      updateTask(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      toast.success('Task saved successfully');
    } catch {
      toast.error('Failed to save task.');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await chessService.deleteTask(task.id);
      removeTask(task.id);
      toast.success('Task removed from board');
      router.push('/main-kanban-board');
    } catch {
      toast.error('Failed to delete task.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background chess-grid-bg p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background chess-grid-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="text-6xl text-muted-foreground opacity-30">♟</span>
          <h2 className="text-xl font-semibold text-foreground">Task not found</h2>
          <p className="text-sm text-muted-foreground">This task may have been deleted or the ID is invalid.</p>
          <button
            onClick={() => router.push('/main-kanban-board')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
          >
            Back to Board
          </button>
        </div>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[task.stage];
  const createdDate = new Date(task.createdAt);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const createdLabel = `${months[createdDate.getMonth()]} ${createdDate.getDate()}, ${createdDate.getFullYear()}`;

  return (
    <>
      <div className="min-h-screen bg-background chess-grid-bg">
        {/* Top nav bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/main-kanban-board')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Board</span>
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <AppLogo size={22} />
              <span className="text-sm font-medium text-foreground hidden sm:block">Task Detail</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 rounded-lg bg-primary/5">
                <span className="text-primary text-sm">♚</span>
                <span className="font-mono font-bold text-primary tabular-nums text-sm">{user.rating}</span>
              </div>
            )}
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Task header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className={`text-4xl stage-${task.stage} leading-none`}>{stageConfig.glyph}</span>
              <div>
                <StageBadge stage={task.stage} size="md" />
                <p className="text-xs text-muted-foreground mt-1">Created {createdLabel}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-all duration-150 active:scale-95"
              aria-label="Delete task — this cannot be undone"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>

          {/* Stage progression breadcrumb */}
          <div className="card-elevated p-4 rounded-xl mb-6">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Stage Progression</p>
            <div className="flex items-center gap-1 flex-wrap">
              {STAGES.map((s, i) => {
                const cfg = STAGE_CONFIG[s];
                const stageIdx = STAGES.indexOf(task.stage);
                const isCompleted = i < stageIdx;
                const isCurrent = s === task.stage;
                const isFuture = i > stageIdx;
                return (
                  <React.Fragment key={`progress-${s}`}>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      isCurrent ? `bg-stage-${s} stage-${s} border border-${s}/30` :
                      isCompleted ? 'text-success bg-success/10 border border-success/20' : 'text-muted-foreground opacity-40'
                    }`}>
                      <span>{cfg.glyph}</span>
                      <span className="hidden sm:block">{cfg.label}</span>
                    </div>
                    {i < STAGES.length - 1 && (
                      <span className={`text-xs ${isCompleted ? 'text-success' : 'text-muted-foreground opacity-30'}`}>→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Edit form */}
          <form id="task-detail-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="card-elevated p-5 rounded-xl space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Task Details</h3>

              {/* Title */}
              <div>
                <label htmlFor="detail-title" className="block text-sm font-medium mb-1.5">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  id="detail-title"
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
                <label htmlFor="detail-description" className="block text-sm font-medium mb-1.5">
                  <span className="flex items-center gap-1.5"><AlignLeft size={13} /> Description</span>
                </label>
                <p className="text-xs text-muted-foreground mb-1.5">Optional context, links, or acceptance criteria</p>
                <textarea
                  id="detail-description"
                  rows={4}
                  placeholder="Add context, links, or acceptance criteria..."
                  className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all resize-none"
                  {...register('description')}
                />
              </div>
            </div>

            <div className="card-elevated p-5 rounded-xl space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Metadata</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label htmlFor="detail-priority" className="block text-sm font-medium mb-1.5">
                    <span className="flex items-center gap-1.5"><Flag size={13} /> Priority</span>
                  </label>
                  <select
                    id="detail-priority"
                    className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                    {...register('priority')}
                  >
                    <option value="">No priority</option>
                    {PRIORITIES.map(p => (
                      <option key={`detail-priority-${p}`} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due date */}
                <div>
                  <label htmlFor="detail-due-date" className="block text-sm font-medium mb-1.5">
                    <span className="flex items-center gap-1.5"><Calendar size={13} /> Due date</span>
                  </label>
                  <input
                    id="detail-due-date"
                    type="date"
                    className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                    {...register('dueDate')}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="detail-tags" className="block text-sm font-medium mb-1.5">
                  <span className="flex items-center gap-1.5"><Tag size={13} /> Tags</span>
                </label>
                <p className="text-xs text-muted-foreground mb-1.5">Comma-separated — e.g. MVP, Bug, Urgent</p>
                <input
                  id="detail-tags"
                  type="text"
                  placeholder="MVP, Testing, Bug"
                  className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                  {...register('tagsRaw')}
                />
              </div>

              {/* Read-only */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Created date</span>
                  <span className="font-mono text-secondary-foreground">{createdLabel} — read only</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Task ID</span>
                  <span className="font-mono text-muted-foreground">{task.id}</span>
                </div>
              </div>
            </div>

            {/* Sticky save bar */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 py-4 border-t border-border bg-background/90 backdrop-blur-sm">
              {isDirty && !saveSuccess && (
                <p className="text-xs text-warning flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
                  Unsaved changes
                </p>
              )}
              {saveSuccess && (
                <p className="text-xs text-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  Saved ✓
                </p>
              )}
              {!isDirty && !saveSuccess && <div />}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/main-kanban-board')}
                  className="px-4 py-2 text-sm font-medium text-secondary-foreground border border-border rounded-lg hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Remove task"
        message="Remove this task from the board? This cannot be undone and will not affect your rating."
        confirmLabel={isDeleting ? 'Removing...' : 'Remove Task'}
        cancelLabel="Keep Task"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
