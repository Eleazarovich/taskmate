'use client';
import React, { useEffect, useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface VictoryOverlayProps {
  taskTitle: string;
  newRating: number;
  onDismiss: () => void;
}

export default function VictoryOverlay({ taskTitle, newRating, onDismiss }: VictoryOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      {/* Dimmed board effect is handled by the overlay backdrop */}
      <div
        className={`relative max-w-md w-full mx-4 transition-all duration-500 ${
          visible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all z-10"
          aria-label="Dismiss victory overlay"
        >
          <X size={15} />
        </button>

        {/* Victory card */}
        <div
          className="card-elevated rounded-2xl overflow-hidden glow-primary"
          style={{
            background: 'linear-gradient(135deg, #16161f 0%, #1e1a0f 50%, #16161f 100%)',
            border: '1px solid rgba(212,175,55,0.4)',
          }}
        >
          {/* Top decorative bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />

          <div className="p-8 text-center">
            {/* King glyph */}
            <div className="text-8xl leading-none mb-4 victory-pulse inline-block">
              ♚
            </div>

            <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-2">
              Task Completed
            </p>

            <h2 className="text-xl font-bold text-foreground mb-6 leading-snug px-4">
              {taskTitle}
            </h2>

            {/* Rating display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="px-4 py-2 rounded-xl border border-primary/30 bg-primary/10">
                <p className="text-xs text-muted-foreground mb-0.5">Rating gained</p>
                <p className="font-mono font-bold text-primary text-lg">+1</p>
              </div>
              <div className="px-4 py-2 rounded-xl border border-primary/40 bg-primary/15">
                <p className="text-xs text-muted-foreground mb-0.5">New rating</p>
                <p className="font-mono font-bold text-primary text-2xl tabular-nums">{newRating}</p>
              </div>
            </div>

            <p className="text-sm text-secondary-foreground italic mb-6">Another victory.</p>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={onDismiss}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all duration-150"
              >
                <ArrowLeft size={16} />
                Back to Board
              </button>
            </div>
          </div>

          {/* Bottom decorative bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
        </div>
      </div>
    </div>
  );
}