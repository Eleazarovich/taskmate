import type {
  User, Board, Task, Stage, Priority,
  MoveResult, AuthResult, PlayerStats,
} from '../types';

export interface IChessKanbanService {
  // Auth
  signUp(name: string, email: string, password: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;

  // Boards
  getBoards(): Promise<Board[]>;
  createBoard(name: string): Promise<Board>;
  deleteBoard(boardId: string): Promise<void>;

  // Tasks
  getTasksByBoard(boardId: string): Promise<Task[]>;
  createTask(boardId: string, title: string, opts?: {
    description?: string;
    priority?: Priority;
    dueDate?: string;
    tags?: string[];
  }): Promise<Task>;
  updateTask(taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'tags'>>): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  moveTask(taskId: string, toStage: Stage, newPosition: number): Promise<MoveResult>;
  reorderTask(taskId: string, newPosition: number): Promise<void>;

  // Stats
  getPlayerStats(): Promise<PlayerStats>;
}