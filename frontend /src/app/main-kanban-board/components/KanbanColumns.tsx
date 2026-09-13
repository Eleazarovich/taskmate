'use client';
import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import type { Task, Stage } from '@/lib/types';
import { STAGES, STAGE_CONFIG, isValidMove, isForwardMove } from '@/lib/types';
import { chessService } from '@/lib/services';
import { playSound } from '@/lib/sounds';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

interface KanbanColumnsProps {
  tasks: Task[];
  boardId: string;
  onTaskMoved: (task: Task, newRating: number, isVictory: boolean) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

export default function KanbanColumns({
  tasks,
  boardId,
  onTaskMoved,
  onTaskClick,
  onAddTask,
}: KanbanColumnsProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [snapBackId, setSnapBackId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getTasksByStage = useCallback((stage: Stage) => {
    return tasks.filter(t => t.stage === stage).sort((a, b) => a.position - b.position);
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverId(null);

    if (!over || !activeTask) return;

    const overId = over.id as string;
    // Determine target stage: could be a column id (stage name) or a task id
    let targetStage: Stage;
    const isColumnDrop = STAGES.includes(overId as Stage);
    if (isColumnDrop) {
      targetStage = overId as Stage;
    } else {
      // Dropped over a task — use that task's stage
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return;
      targetStage = overTask.stage;
    }

    const fromStage = activeTask.stage;

    // Same stage — reorder
    if (fromStage === targetStage) {
      return; // position reorder handled by sortable context
    }

    // Validate adjacency
    if (!isValidMove(fromStage, targetStage)) {
      playSound('invalid-move');
      setSnapBackId(activeTask.id);
      setTimeout(() => setSnapBackId(null), 500);
      toast.error('Invalid move — tasks can only move one stage at a time.', {
        icon: '⚠️',
        duration: 2500,
      });
      return;
    }

    const stageTasks = getTasksByStage(targetStage);
    const newPosition = stageTasks.length;

    try {
      // Backend integration point: persist stage move
      const result = await chessService.moveTask(activeTask.id, targetStage, newPosition);
      if (!result.success) {
        playSound('invalid-move');
        toast.error(result.error || 'Move failed.');
        return;
      }

      const updatedTask: Task = { ...activeTask, stage: targetStage, position: newPosition };
      const forward = isForwardMove(fromStage, targetStage);
      playSound(forward ? 'move-forward' : 'move-backward');

      if (result.isVictory) {
        playSound('victory');
      } else if (!forward) {
        const stageLabel = STAGE_CONFIG[targetStage].label;
        toast(`♞ Moved back to ${stageLabel}`, { description: result.ratingDelta < 0 ? '−1 rating' : '', duration: 2000 });
      } else {
        const stageLabel = STAGE_CONFIG[targetStage].label;
        toast.success(`♟ Advanced to ${stageLabel}`, { description: '+1 rating', duration: 2000 });
      }

      onTaskMoved(updatedTask, result.newRating, result.isVictory);
    } catch {
      playSound('invalid-move');
      toast.error('Failed to move task. Please try again.');
    }
  }, [activeTask, tasks, getTasksByStage, onTaskMoved]);

  // Determine if a column is a valid drop target for the active task
  const getColumnDropState = useCallback((stage: Stage): 'valid' | 'invalid' | 'none' => {
    if (!activeTask) return 'none';
    if (activeTask.stage === stage) return 'none';
    if (isValidMove(activeTask.stage, stage)) return 'valid';
    return 'invalid';
  }, [activeTask]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto h-full scrollbar-game">
        {STAGES.map(stage => (
          <KanbanColumn
            key={`col-${stage}`}
            stage={stage}
            tasks={getTasksByStage(stage)}
            dropState={getColumnDropState(stage)}
            isOver={overId === stage}
            onTaskClick={onTaskClick}
            onAddTask={stage === 'pawn' ? onAddTask : undefined}
            snapBackId={snapBackId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="card-lift">
            <TaskCard
              task={activeTask}
              isDragging
              isSnapBack={false}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}