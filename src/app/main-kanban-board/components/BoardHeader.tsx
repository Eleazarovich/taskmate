'use client';
import React from 'react';
import { Menu, Plus, User as UserIcon, LayoutGrid } from 'lucide-react';
import type { User, Board } from '@/lib/types';
import AppLogo from '@/components/ui/AppLogo';

interface BoardHeaderProps {
  user: User | null;
  activeBoard: Board | undefined;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewTask: () => void;
  onOpenProfile: () => void;
}

export default function BoardHeader({
  user,
  activeBoard,
  sidebarOpen,
  onToggleSidebar,
  onNewTask,
  onOpenProfile,
}: BoardHeaderProps) {
  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm z-30 relative">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <AppLogo size={24} />
          <span className="text-sm font-semibold text-foreground hidden sm:block">Taskmate</span>
        </div>
        {activeBoard && (
          <>
            <span className="text-muted-foreground hidden sm:block">/</span>
            <div className="flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground max-w-[180px] truncate" title={activeBoard.name}>
                {activeBoard.name}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all duration-150"
        >
          <Plus size={16} />
          <span className="hidden sm:block">New Task</span>
        </button>

        {/* Rating display */}
        {user && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 rounded-lg bg-primary/5">
            <span className="text-primary text-base leading-none">♚</span>
            <span className="text-xs font-medium text-muted-foreground">Rating</span>
            <span className="font-mono font-bold text-primary tabular-nums text-sm">{user.rating}</span>
          </div>
        )}

        {/* Profile button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-all duration-150 group"
          aria-label="Open player profile"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            {user ? (
              <span className="text-xs font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <UserIcon size={14} className="text-primary" />
            )}
          </div>
          {user && (
            <span className="text-sm font-medium text-foreground hidden md:block max-w-[100px] truncate">{user.name}</span>
          )}
        </button>
      </div>
    </header>
  );
}