'use client';
import React, { useState } from 'react';
import { Plus, LayoutGrid, ChevronRight } from 'lucide-react';
import type { Board } from '@/lib/types';

interface BoardSidebarProps {
  boards: Board[];
  activeBoardId: string | null;
  isOpen: boolean;
  onSelectBoard: (id: string) => void;
  onCreateBoard: () => void;
}

export default function BoardSidebar({
  boards,
  activeBoardId,
  isOpen,
  onSelectBoard,
  onCreateBoard,
}: BoardSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside
      className={`flex-shrink-0 border-r border-border bg-card/50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'w-56' : 'w-0'
      }`}
      style={{ minHeight: 0 }}
    >
      <div className="flex-1 overflow-y-auto scrollbar-game p-3 space-y-1">
        <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2 mt-1">
            Boards
          </p>
          {boards.map(board => (
            <button
              key={`sidebar-board-${board.id}`}
              onClick={() => onSelectBoard(board.id)}
              onMouseEnter={() => setHoveredId(board.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-all duration-150 group ${
                activeBoardId === board.id
                  ? 'bg-primary/10 text-primary border border-primary/20' :'text-secondary-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <LayoutGrid size={14} className="flex-shrink-0" />
              <span className="flex-1 truncate font-medium">{board.name}</span>
              {(hoveredId === board.id || activeBoardId === board.id) && (
                <ChevronRight size={12} className="flex-shrink-0 opacity-60" />
              )}
            </button>
          ))}

          {boards.length === 0 && (
            <div className="px-2 py-4 text-center">
              <p className="text-xs text-muted-foreground">No boards yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first board below</p>
            </div>
          )}
        </div>
      </div>

      <div className={`p-3 border-t border-border transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={onCreateBoard}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 border border-dashed border-border hover:border-primary/40 transition-all duration-150"
        >
          <Plus size={14} />
          <span className="font-medium">New Board</span>
        </button>
      </div>
    </aside>
  );
}