'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { chessService } from '@/lib/services';
import type { Task } from '@/lib/types';

interface CreateTaskModalProps {
  boardId: string;
  initialStage: 'pawn';
  onCreated: (task: Task) => void;
  onClose: () => void;
}

interface FormData {
  title: string;
}

export default function CreateTaskModal({ boardId, onCreated, onClose }: CreateTaskModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      // Backend integration point: create task via API
      const task = await chessService.createTask(boardId, data.title.trim());
      toast.success('Task added to Pawn / Backlog');
      onCreated(task);
    } catch {
      toast.error('Failed to create task.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-sm p-6 animate-fade-in-scale"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl text-pawn">♟</span>
            <h3 id="create-task-title" className="text-base font-semibold">New Task</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium mb-1.5">
              Task title
            </label>
            <p className="text-xs text-muted-foreground mb-1.5">You can add details after creating the task</p>
            <input
              id="task-title"
              type="text"
              autoFocus
              placeholder="What needs to be done?"
              className={`w-full bg-input border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                errors.title ? 'border-danger' : 'border-border focus:border-primary'
              }`}
              {...register('title', {
                required: 'Task title is required',
                minLength: { value: 2, message: 'Title must be at least 2 characters' },
                maxLength: { value: 120, message: 'Title must be under 120 characters' },
              })}
            />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
          </div>

          <p className="text-xs text-muted-foreground">
            Task will start in <span className="text-pawn font-medium">♟ Pawn / Backlog</span>
          </p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-foreground border border-border rounded-lg hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : null}
              <Plus size={15} />
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}