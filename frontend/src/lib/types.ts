export type Stage = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  name: string;
  email: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  tags: string[];
  stage: Stage;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoveResult {
  success: boolean;
  ratingDelta: number;
  isVictory: boolean;
  newRating: number;
  error?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  accessToken?: string;
}

export interface PlayerStats {
  user: User;
  totalCompleted: number;
  totalBoards: number;
  tasksByStage: Record<Stage, number>;
  recentMoves: RecentMove[];
}

export interface RecentMove {
  id: string;
  taskTitle: string;
  fromStage: Stage;
  toStage: Stage;
  ratingDelta: number;
  timestamp: string;
}

export const STAGES: Stage[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export const STAGE_CONFIG: Record<Stage, { glyph: string; label: string; kanbanLabel: string; colorVar: string }> = {
  pawn:   { glyph: '♟', label: 'PAWN',   kanbanLabel: 'Backlog',    colorVar: '--pawn'   },
  knight: { glyph: '♞', label: 'KNIGHT', kanbanLabel: 'To Do',      colorVar: '--knight' },
  bishop: { glyph: '♝', label: 'BISHOP', kanbanLabel: 'In Progress',colorVar: '--bishop' },
  rook:   { glyph: '♜', label: 'ROOK',   kanbanLabel: 'Testing',    colorVar: '--rook'   },
  queen:  { glyph: '♛', label: 'QUEEN',  kanbanLabel: 'Review',     colorVar: '--queen'  },
  king:   { glyph: '♚', label: 'KING',   kanbanLabel: 'Completed',  colorVar: '--king'   },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low:      { label: 'Low',      color: 'text-muted-foreground' },
  medium:   { label: 'Medium',   color: 'text-knight' },
  high:     { label: 'High',     color: 'text-warning' },
  critical: { label: 'Critical', color: 'text-danger' },
};

export function getAdjacentStages(stage: Stage): { prev: Stage | null; next: Stage | null } {
  const idx = STAGES.indexOf(stage);
  return {
    prev: idx > 0 ? STAGES[idx - 1] : null,
    next: idx < STAGES.length - 1 ? STAGES[idx + 1] : null,
  };
}

export function isValidMove(from: Stage, to: Stage): boolean {
  const idx = STAGES.indexOf(from);
  const toIdx = STAGES.indexOf(to);
  return Math.abs(idx - toIdx) === 1;
}

export function isForwardMove(from: Stage, to: Stage): boolean {
  return STAGES.indexOf(to) > STAGES.indexOf(from);
}
