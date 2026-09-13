'use client';
import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { chessService } from '@/lib/services';
import { playSound } from '@/lib/sounds';
import type { Board } from '@/lib/types';

interface CreateBoardModalProps {
  onCreated: (board: Board) => void;
  onClose: () => void;
}

interface FormData {
  name: string;
}

export default function CreateBoardModal({ onCreated, onClose }: CreateBoardModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSubmit = async (data: FormData) => {
    try {
      // Backend integration point: create board via API
      const board = await chessService.createBoard(data.name.trim());
      playSound('board-create');
      toast.success(`Board "${board.name}" created!`);
      onCreated(board);
    } catch {
      toast.error('Failed to create board. Please try again.');
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
        aria-labelledby="create-board-title"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-primary" />
            <h3 id="create-board-title" className="text-base font-semibold">New Board</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="board-name" className="block text-sm font-medium mb-1.5">
              Board name
            </label>
            <p className="text-xs text-muted-foreground mb-1.5">
              E.g. Work Projects, Personal Goals, Coding
            </p>
            <input
              id="board-name"
              type="text"
              placeholder="My new board"
              className={`w-full bg-input border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                errors.name ? 'border-danger' : 'border-border focus:border-primary'
              }`}
              {...register('name', {
                required: 'Board name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 50, message: 'Name must be under 50 characters' },
              })}
              ref={(el) => {
                register('name').ref(el);
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
              }}
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground">
              Your board will automatically include all six chess stages: ♟ Pawn → ♞ Knight → ♝ Bishop → ♜ Rook → ♛ Queen → ♚ King
            </p>
          </div>

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
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}