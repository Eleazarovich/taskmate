'use client';
import React, { useState, useCallback } from 'react';
import type { User, Board, Task } from '@/lib/types';
import { AppContext } from '@/lib/store';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [boards, setBoardsState] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardIdState] = useState<string | null>(null);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [isLoading, setIsLoadingState] = useState(false);

  const setUser = useCallback((u: User | null) => setUserState(u), []);
  const setBoards = useCallback((b: Board[]) => setBoardsState(b), []);
  const setActiveBoardId = useCallback((id: string | null) => setActiveBoardIdState(id), []);
  const setTasks = useCallback((t: Task[]) => setTasksState(t), []);
  const setIsLoading = useCallback((v: boolean) => setIsLoadingState(v), []);

  const updateTask = useCallback((task: Task) => {
    setTasksState(prev => prev.map(t => t.id === task.id ? task : t));
  }, []);

  const addTask = useCallback((task: Task) => {
    setTasksState(prev => [...prev, task]);
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setTasksState(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addBoard = useCallback((board: Board) => {
    setBoardsState(prev => [...prev, board]);
  }, []);

  const updateRating = useCallback((newRating: number) => {
    setUserState(prev => prev ? { ...prev, rating: newRating } : null);
  }, []);

  return (
    <AppContext.Provider value={{
      user, boards, activeBoardId, tasks, isLoading,
      setUser, setBoards, setActiveBoardId, setTasks,
      updateTask, addTask, removeTask, addBoard, updateRating,
      setIsLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}