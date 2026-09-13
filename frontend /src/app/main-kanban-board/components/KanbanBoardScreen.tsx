'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { chessService } from '@/lib/services';
import { useAppContext } from '@/lib/store';
import type { Board, Task } from '@/lib/types';
import { BoardSkeleton } from '@/components/ui/LoadingSkeleton';
import BoardHeader from './BoardHeader';
import BoardSidebar from './BoardSidebar';
import KanbanColumns from './KanbanColumns';
import VictoryOverlay from './VictoryOverlay';
import CreateBoardModal from './CreateBoardModal';
import CreateTaskModal from './CreateTaskModal';

export interface VictoryData {
  taskTitle: string;
  newRating: number;
}

export default function KanbanBoardScreen() {
  const router = useRouter();
  const { user, setUser, boards, setBoards, activeBoardId, setActiveBoardId, tasks, setTasks, addBoard, addTask, updateTask, removeTask, updateRating } = useAppContext();

  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskStage] = useState<'pawn'>('pawn');
  const [victoryData, setVictoryData] = useState<VictoryData | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Auth guard + load initial data
  useEffect(() => {
    async function init() {
      try {
        // Backend integration point: check session/token
        const currentUser = await chessService.getCurrentUser();
        if (!currentUser) {
          router.push('/');
          return;
        }
        setUser(currentUser);
        const userBoards = await chessService.getBoards();
        setBoards(userBoards);
        if (userBoards.length > 0) {
          setActiveBoardId(userBoards[0].id);
        }
      } catch {
        router.push('/');
      } finally {
        setIsLoadingBoards(false);
      }
    }
    init();
  }, [router, setUser, setBoards, setActiveBoardId]);

  // Load tasks when active board changes
  useEffect(() => {
    if (!activeBoardId) return;
    setIsLoadingTasks(true);
    // Backend integration point: fetch tasks for board
    chessService.getTasksByBoard(activeBoardId).then(boardTasks => {
      setTasks(boardTasks);
    }).catch(() => {
      toast.error('Failed to load tasks. Please refresh.');
    }).finally(() => {
      setIsLoadingTasks(false);
    });
  }, [activeBoardId, setTasks]);

  const handleBoardCreated = useCallback((board: Board) => {
    addBoard(board);
    setActiveBoardId(board.id);
    setTasks([]);
    setShowCreateBoard(false);
  }, [addBoard, setActiveBoardId, setTasks]);

  const handleTaskCreated = useCallback((task: Task) => {
    addTask(task);
    setShowCreateTask(false);
  }, [addTask]);

  const handleTaskMoved = useCallback((task: Task, newRating: number, isVictory: boolean) => {
    updateTask(task);
    updateRating(newRating);
    if (isVictory) {
      setVictoryData({ taskTitle: task.title, newRating });
    }
  }, [updateTask, updateRating]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    removeTask(taskId);
  }, [removeTask]);

  const activeBoard = boards.find(b => b.id === activeBoardId);
  const boardTasks = tasks.filter(t => t.boardId === activeBoardId);

  if (isLoadingBoards) {
    return (
      <div className="min-h-screen bg-background chess-grid-bg flex flex-col">
        <div className="h-14 border-b border-border bg-card animate-pulse" />
        <BoardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background chess-grid-bg flex flex-col relative">
      <BoardHeader
        user={user}
        activeBoard={activeBoard}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        onNewTask={() => setShowCreateTask(true)}
        onOpenProfile={() => router.push('/player-profile-stats')}
      />

      <div className="flex flex-1 overflow-hidden">
        <BoardSidebar
          boards={boards}
          activeBoardId={activeBoardId}
          isOpen={sidebarOpen}
          onSelectBoard={setActiveBoardId}
          onCreateBoard={() => setShowCreateBoard(true)}
        />

        <main className="flex-1 overflow-hidden relative">
          {isLoadingTasks ? (
            <BoardSkeleton />
          ) : (
            <KanbanColumns
              tasks={boardTasks}
              boardId={activeBoardId || ''}
              onTaskMoved={handleTaskMoved}
              onTaskClick={setEditingTask}
              onAddTask={() => setShowCreateTask(true)}
            />
          )}
        </main>
      </div>

      {/* Victory overlay — rendered over board */}
      {victoryData && (
        <VictoryOverlay
          taskTitle={victoryData.taskTitle}
          newRating={victoryData.newRating}
          onDismiss={() => setVictoryData(null)}
        />
      )}

      {/* Modals */}
      {showCreateBoard && (
        <CreateBoardModal
          onCreated={handleBoardCreated}
          onClose={() => setShowCreateBoard(false)}
        />
      )}

      {showCreateTask && activeBoardId && (
        <CreateTaskModal
          boardId={activeBoardId}
          initialStage={createTaskStage}
          onCreated={handleTaskCreated}
          onClose={() => setShowCreateTask(false)}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSaved={(updated) => { updateTask(updated); setEditingTask(null); }}
          onDeleted={(id) => { handleTaskDeleted(id); setEditingTask(null); }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

// Lazy import to avoid circular dependency
import EditTaskModal from './EditTaskModal'
;