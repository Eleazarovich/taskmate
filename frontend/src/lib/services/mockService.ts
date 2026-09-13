import type { IChessKanbanService } from './IChessKanbanService';
import type { User, Board, Task, Stage, RecentMove,  } from '../types';
import { STAGES, isValidMove, isForwardMove } from '../types';

// ─── In-memory store ───────────────────────────────────────────────────────────
let currentUser: User | null = null;
let boards: Board[] = [];
let tasks: Task[] = [];
let recentMoves: RecentMove[] = [];

// ─── Seed users ───────────────────────────────────────────────────────────────
const seedUsers: (User & { password: string })[] = [
  {
    id: 'user-001',
    name: 'Kasparov Dev',
    email: 'kasparov@chesskanban.app',
    password: 'KingMe2026!',
    rating: 42,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-11T19:00:00Z',
  },
];

// ─── Seed boards ─────────────────────────────────────────────────────────────
const seedBoards: Board[] = [
  { id: 'board-001', userId: 'user-001', name: 'Work Projects', createdAt: '2026-08-02T09:00:00Z', updatedAt: '2026-09-10T14:00:00Z' },
  { id: 'board-002', userId: 'user-001', name: 'Personal Goals', createdAt: '2026-08-15T11:00:00Z', updatedAt: '2026-09-08T16:00:00Z' },
  { id: 'board-003', userId: 'user-001', name: 'Coding Projects', createdAt: '2026-09-01T08:00:00Z', updatedAt: '2026-09-11T19:00:00Z' },
];

// ─── Seed tasks ───────────────────────────────────────────────────────────────
const seedTasks: Task[] = [
  // board-001 tasks
  { id: 'task-001', boardId: 'board-001', title: 'Define Q4 product roadmap', description: 'Align with stakeholders on priorities for Q4 delivery milestones.', priority: 'high', dueDate: '2026-09-20', tags: ['Planning', 'Q4'], stage: 'rook', position: 0, createdAt: '2026-08-10T09:00:00Z', updatedAt: '2026-09-09T14:00:00Z' },
  { id: 'task-002', boardId: 'board-001', title: 'Migrate auth to OAuth2', description: 'Replace legacy session auth with OAuth2 provider integration.', priority: 'critical', dueDate: '2026-09-15', tags: ['Auth', 'Security', 'Backend'], stage: 'bishop', position: 0, createdAt: '2026-08-12T10:00:00Z', updatedAt: '2026-09-10T11:00:00Z' },
  { id: 'task-003', boardId: 'board-001', title: 'Write API documentation', description: 'Document all public endpoints with request/response examples.', priority: 'medium', dueDate: '2026-09-25', tags: ['Docs', 'API'], stage: 'knight', position: 0, createdAt: '2026-08-14T08:00:00Z', updatedAt: '2026-09-05T09:00:00Z' },
  { id: 'task-004', boardId: 'board-001', title: 'Set up CI/CD pipeline', priority: 'high', tags: ['DevOps', 'Automation'], stage: 'pawn', position: 0, createdAt: '2026-08-20T10:00:00Z', updatedAt: '2026-08-20T10:00:00Z' },
  { id: 'task-005', boardId: 'board-001', title: 'Performance audit — dashboard load time', priority: 'medium', tags: ['Performance'], stage: 'pawn', position: 1, createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'task-006', boardId: 'board-001', title: 'Design system tokens v2', description: 'Refresh color and typography tokens across all components.', priority: 'low', tags: ['Design', 'UI'], stage: 'queen', position: 0, createdAt: '2026-08-05T10:00:00Z', updatedAt: '2026-09-11T10:00:00Z' },
  { id: 'task-007', boardId: 'board-001', title: 'Deploy staging environment', priority: 'high', dueDate: '2026-09-12', tags: ['DevOps'], stage: 'king', position: 0, createdAt: '2026-07-28T08:00:00Z', updatedAt: '2026-09-10T18:00:00Z' },
  { id: 'task-008', boardId: 'board-001', title: 'User research interviews — 5 sessions', priority: 'medium', tags: ['Research', 'UX'], stage: 'pawn', position: 2, createdAt: '2026-09-05T10:00:00Z', updatedAt: '2026-09-05T10:00:00Z' },

  // board-002 tasks
  { id: 'task-009', boardId: 'board-002', title: 'Read "Deep Work" by Cal Newport', priority: 'low', tags: ['Books', 'Learning'], stage: 'bishop', position: 0, createdAt: '2026-08-18T20:00:00Z', updatedAt: '2026-09-08T21:00:00Z' },
  { id: 'task-010', boardId: 'board-002', title: 'Run 5k three times per week', priority: 'medium', tags: ['Health', 'Fitness'], stage: 'knight', position: 0, createdAt: '2026-08-01T07:00:00Z', updatedAt: '2026-09-01T07:00:00Z' },
  { id: 'task-011', boardId: 'board-002', title: 'Learn Spanish — Duolingo streak 30d', priority: 'low', tags: ['Language', 'Learning'], stage: 'pawn', position: 0, createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'task-012', boardId: 'board-002', title: 'Plan October hiking trip', priority: 'medium', dueDate: '2026-09-30', tags: ['Travel', 'Personal'], stage: 'pawn', position: 1, createdAt: '2026-09-05T18:00:00Z', updatedAt: '2026-09-05T18:00:00Z' },

  // board-003 tasks
  { id: 'task-013', boardId: 'board-003', title: 'Build Taskmate MVP', description: 'Full-stack personal kanban with chess progression system.', priority: 'critical', dueDate: '2026-09-15', tags: ['MVP', 'Next.js', 'Chess'], stage: 'queen', position: 0, createdAt: '2026-08-25T10:00:00Z', updatedAt: '2026-09-11T19:00:00Z' },
  { id: 'task-014', boardId: 'board-003', title: 'Add drag-and-drop with @dnd-kit', priority: 'high', tags: ['DnD', 'UI'], stage: 'rook', position: 0, createdAt: '2026-09-02T11:00:00Z', updatedAt: '2026-09-10T15:00:00Z' },
  { id: 'task-015', boardId: 'board-003', title: 'Implement sound feedback system', priority: 'medium', tags: ['Audio', 'UX'], stage: 'bishop', position: 0, createdAt: '2026-09-05T09:00:00Z', updatedAt: '2026-09-09T14:00:00Z' },
  { id: 'task-016', boardId: 'board-003', title: 'Write unit tests for services layer', priority: 'high', tags: ['Testing', 'Quality'], stage: 'knight', position: 0, createdAt: '2026-09-08T10:00:00Z', updatedAt: '2026-09-08T10:00:00Z' },
  { id: 'task-017', boardId: 'board-003', title: 'Set up Vercel deployment', priority: 'medium', tags: ['DevOps', 'Deploy'], stage: 'pawn', position: 0, createdAt: '2026-09-11T08:00:00Z', updatedAt: '2026-09-11T08:00:00Z' },
  { id: 'task-018', boardId: 'board-003', title: 'Portfolio auth system', priority: 'critical', dueDate: '2026-09-18', tags: ['Auth', 'Portfolio'], stage: 'king', position: 0, createdAt: '2026-08-20T09:00:00Z', updatedAt: '2026-09-09T17:00:00Z' },
];

const seedRecentMoves: RecentMove[] = [
  { id: 'move-001', taskTitle: 'Portfolio auth system', fromStage: 'queen', toStage: 'king', ratingDelta: 1, timestamp: '2026-09-09T17:00:00Z' },
  { id: 'move-002', taskTitle: 'Design system tokens v2', fromStage: 'rook', toStage: 'queen', ratingDelta: 1, timestamp: '2026-09-11T10:00:00Z' },
  { id: 'move-003', taskTitle: 'Build Taskmate MVP', fromStage: 'rook', toStage: 'queen', ratingDelta: 1, timestamp: '2026-09-11T09:30:00Z' },
  { id: 'move-004', taskTitle: 'Add drag-and-drop with @dnd-kit', fromStage: 'bishop', toStage: 'rook', ratingDelta: 1, timestamp: '2026-09-10T15:00:00Z' },
  { id: 'move-005', taskTitle: 'Deploy staging environment', fromStage: 'queen', toStage: 'king', ratingDelta: 1, timestamp: '2026-09-10T18:00:00Z' },
];

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Initialize seed data
function initSeedData() {
  if (boards.length === 0) {
    boards = [...seedBoards];
    tasks = [...seedTasks];
    recentMoves = [...seedRecentMoves];
  }
}

export const mockService: IChessKanbanService = {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  async signUp(name, email, password) {
    await delay(600);
    const existing = seedUsers.find(u => u.email === email);
    if (existing) return { success: false, error: 'An account with this email already exists.' };
    const newUser: User = {
      id: generateId('user'),
      name,
      email,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    seedUsers.push({ ...newUser, password });
    currentUser = newUser;
    initSeedData();
    return { success: true, user: newUser };
  },

  async login(email, password) {
    await delay(600);
    const found = seedUsers.find(u => u.email === email && u.password === password);
    if (!found) return { success: false, error: 'Invalid credentials — use the demo accounts below to sign in.' };
    const { password: _pw, ...user } = found;
    currentUser = user;
    initSeedData();
    return { success: true, user };
  },

  async logout() {
    await delay(200);
    currentUser = null;
  },

  async getCurrentUser() {
    await delay(100);
    return currentUser;
  },

  // ── Boards ───────────────────────────────────────────────────────────────────
  async getBoards() {
    await delay(300);
    if (!currentUser) throw new Error('Not authenticated');
    return boards.filter(b => b.userId === currentUser!.id);
  },

  async createBoard(name) {
    await delay(400);
    if (!currentUser) throw new Error('Not authenticated');
    const board: Board = {
      id: generateId('board'),
      userId: currentUser.id,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    boards.push(board);
    return board;
  },

  async deleteBoard(boardId) {
    await delay(300);
    boards = boards.filter(b => b.id !== boardId);
    tasks = tasks.filter(t => t.boardId !== boardId);
  },

  // ── Tasks ────────────────────────────────────────────────────────────────────
  async getTasksByBoard(boardId) {
    await delay(300);
    return tasks.filter(t => t.boardId === boardId).sort((a, b) => a.position - b.position);
  },

  async createTask(boardId, title, opts = {}) {
    await delay(300);
    const stageTasks = tasks.filter(t => t.boardId === boardId && t.stage === 'pawn');
    const task: Task = {
      id: generateId('task'),
      boardId,
      title,
      description: opts.description,
      priority: opts.priority,
      dueDate: opts.dueDate,
      tags: opts.tags || [],
      stage: 'pawn',
      position: stageTasks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(task);
    return task;
  },

  async updateTask(taskId, updates) {
    await delay(400);
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error('Task not found');
    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    return tasks[idx];
  },

  async deleteTask(taskId) {
    await delay(300);
    tasks = tasks.filter(t => t.id !== taskId);
  },

  async moveTask(taskId, toStage, newPosition) {
    await delay(200);
    if (!currentUser) throw new Error('Not authenticated');
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error('Task not found');
    const task = tasks[idx];
    const fromStage = task.stage;

    if (fromStage === toStage) {
      return { success: true, ratingDelta: 0, isVictory: false, newRating: currentUser.rating };
    }

    if (!isValidMove(fromStage, toStage)) {
      return { success: false, ratingDelta: 0, isVictory: false, newRating: currentUser.rating, error: 'Invalid move — tasks can only move one stage at a time.' };
    }

    const forward = isForwardMove(fromStage, toStage);
    const ratingDelta = forward ? 1 : -1;
    const isVictory = fromStage === 'queen' && toStage === 'king';

    // Update task stage
    tasks[idx] = { ...tasks[idx], stage: toStage, position: newPosition, updatedAt: new Date().toISOString() };

    // Update rating
    const seedUser = seedUsers.find(u => u.id === currentUser!.id);
    if (seedUser) {
      seedUser.rating = Math.max(0, seedUser.rating + ratingDelta);
      currentUser = { ...currentUser!, rating: seedUser.rating };
    }

    // Record move
    const move: RecentMove = {
      id: generateId('move'),
      taskTitle: task.title,
      fromStage,
      toStage,
      ratingDelta: forward ? 1 : -1,
      timestamp: new Date().toISOString(),
    };
    recentMoves.unshift(move);
    if (recentMoves.length > 20) recentMoves = recentMoves.slice(0, 20);

    return {
      success: true,
      ratingDelta,
      isVictory,
      newRating: currentUser!.rating,
    };
  },

  async reorderTask(taskId, newPosition) {
    await delay(150);
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], position: newPosition, updatedAt: new Date().toISOString() };
    }
  },

  // ── Stats ─────────────────────────────────────────────────────────────────────
  async getPlayerStats() {
    await delay(400);
    if (!currentUser) throw new Error('Not authenticated');
    const userBoards = boards.filter(b => b.userId === currentUser!.id);
    const userTasks = tasks.filter(t => userBoards.some(b => b.id === t.boardId));
    const completed = userTasks.filter(t => t.stage === 'king').length;
    const tasksByStage = STAGES.reduce((acc, s) => {
      acc[s] = userTasks.filter(t => t.stage === s).length;
      return acc;
    }, {} as Record<Stage, number>);

    return {
      user: currentUser!,
      totalCompleted: completed,
      totalBoards: userBoards.length,
      tasksByStage,
      recentMoves: recentMoves.slice(0, 8),
    };
  },
};