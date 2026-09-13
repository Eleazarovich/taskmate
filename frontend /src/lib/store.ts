'use client';
import { createContext, useContext } from 'react';
import type { User, Board, Task } from './types';

export interface AppState {
  user: User | null;
  boards: Board[];
  activeBoardId: string | null;
  tasks: Task[];
  isLoading: boolean;
}

export interface AppActions {
  setUser: (user: User | null) => void;
  setBoards: (boards: Board[]) => void;
  setActiveBoardId: (id: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  addBoard: (board: Board) => void;
  updateRating: (newRating: number) => void;
  setIsLoading: (v: boolean) => void;
}

export const AppContext = createContext<(AppState & AppActions) | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}