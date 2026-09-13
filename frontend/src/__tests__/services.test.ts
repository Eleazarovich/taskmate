import { describe, test, expect, beforeEach } from '@jest/globals';
import { mockService } from '@/lib/services/mockService';

import { isValidMove, isForwardMove, STAGES } from '@/lib/types';

// ─── Unit tests for business logic ───────────────────────────────────────────

describe('isValidMove', () => {
  test('adjacent forward moves are valid', () => {
    expect(isValidMove('pawn', 'knight')).toBe(true);
    expect(isValidMove('knight', 'bishop')).toBe(true);
    expect(isValidMove('bishop', 'rook')).toBe(true);
    expect(isValidMove('rook', 'queen')).toBe(true);
    expect(isValidMove('queen', 'king')).toBe(true);
  });

  test('adjacent backward moves are valid', () => {
    expect(isValidMove('knight', 'pawn')).toBe(true);
    expect(isValidMove('bishop', 'knight')).toBe(true);
    expect(isValidMove('rook', 'bishop')).toBe(true);
    expect(isValidMove('queen', 'rook')).toBe(true);
    expect(isValidMove('king', 'queen')).toBe(true);
  });

  test('skipping stages is invalid', () => {
    expect(isValidMove('pawn', 'bishop')).toBe(false);
    expect(isValidMove('pawn', 'king')).toBe(false);
    expect(isValidMove('knight', 'rook')).toBe(false);
    expect(isValidMove('bishop', 'queen')).toBe(false);
    expect(isValidMove('rook', 'king')).toBe(false);
  });

  test('same stage is invalid', () => {
    STAGES.forEach(stage => {
      expect(isValidMove(stage, stage)).toBe(false);
    });
  });
});

describe('isForwardMove', () => {
  test('forward moves detected correctly', () => {
    expect(isForwardMove('pawn', 'knight')).toBe(true);
    expect(isForwardMove('queen', 'king')).toBe(true);
  });

  test('backward moves detected correctly', () => {
    expect(isForwardMove('knight', 'pawn')).toBe(false);
    expect(isForwardMove('king', 'queen')).toBe(false);
  });
});

describe('mockService — authentication', () => {
  test('login succeeds with correct credentials', async () => {
    const result = await mockService.login('kasparov@chesskanban.app', 'KingMe2026!');
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('kasparov@chesskanban.app');
  });

  test('login fails with wrong password', async () => {
    const result = await mockService.login('kasparov@chesskanban.app', 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid credentials');
  });

  test('login fails with unknown email', async () => {
    const result = await mockService.login('unknown@example.com', 'anything');
    expect(result.success).toBe(false);
  });

  test('signup creates a new user with zero rating', async () => {
    const result = await mockService.signUp('Test Player', 'testplayer@example.com', 'TestPass123!');
    expect(result.success).toBe(true);
    expect(result.user?.rating).toBe(0);
    expect(result.user?.name).toBe('Test Player');
  });

  test('signup fails if email already exists', async () => {
    const result = await mockService.signUp('Duplicate', 'kasparov@chesskanban.app', 'pass');
    expect(result.success).toBe(false);
  });

  test('getCurrentUser returns null before login', async () => {
    await mockService.logout();
    const user = await mockService.getCurrentUser();
    expect(user).toBeNull();
  });
});

describe('mockService — boards', () => {
  beforeEach(async () => {
    await mockService.login('kasparov@chesskanban.app', 'KingMe2026!');
  });

  test('getBoards returns seeded boards', async () => {
    const boards = await mockService.getBoards();
    expect(boards.length).toBeGreaterThan(0);
  });

  test('createBoard adds a new board', async () => {
    const before = await mockService.getBoards();
    await mockService.createBoard('Test Board');
    const after = await mockService.getBoards();
    expect(after.length).toBe(before.length + 1);
    expect(after.some(b => b.name === 'Test Board')).toBe(true);
  });
});

describe('mockService — tasks', () => {
  let boardId: string;

  beforeEach(async () => {
    await mockService.login('kasparov@chesskanban.app', 'KingMe2026!');
    const boards = await mockService.getBoards();
    boardId = boards[0].id;
  });

  test('new task starts in pawn stage', async () => {
    const task = await mockService.createTask(boardId, 'Test task');
    expect(task.stage).toBe('pawn');
    expect(task.boardId).toBe(boardId);
  });

  test('moveTask with valid adjacent forward move succeeds', async () => {
    const task = await mockService.createTask(boardId, 'Move test task');
    const result = await mockService.moveTask(task.id, 'knight', 0);
    expect(result.success).toBe(true);
    expect(result.ratingDelta).toBe(1);
    expect(result.isVictory).toBe(false);
  });

  test('moveTask with skipped stage fails', async () => {
    const task = await mockService.createTask(boardId, 'Skip test task');
    const result = await mockService.moveTask(task.id, 'bishop', 0);
    expect(result.success).toBe(false);
    expect(result.ratingDelta).toBe(0);
  });

  test('moveTask backward decrements rating', async () => {
    const task = await mockService.createTask(boardId, 'Backward test');
    await mockService.moveTask(task.id, 'knight', 0);
    const userBefore = await mockService.getCurrentUser();
    const ratingBefore = userBefore!.rating;
    const result = await mockService.moveTask(task.id, 'pawn', 0);
    expect(result.success).toBe(true);
    expect(result.ratingDelta).toBe(-1);
    expect(result.newRating).toBe(Math.max(0, ratingBefore - 1));
  });

  test('rating never goes below zero', async () => {
    // Create a fresh user with 0 rating
    await mockService.signUp('ZeroRating', 'zero@test.com', 'ZeroPass123!');
    const boards = await mockService.getBoards();
    const bid = boards[boards.length - 1]?.id || boardId;
    const task = await mockService.createTask(bid, 'Zero test');
    const result = await mockService.moveTask(task.id, 'pawn', 0); // same stage
    expect(result.newRating).toBeGreaterThanOrEqual(0);
  });

  test('queen to king triggers victory', async () => {
    // Move a task from pawn through all stages to queen first
    const task = await mockService.createTask(boardId, 'Victory test');
    await mockService.moveTask(task.id, 'knight', 0);
    await mockService.moveTask(task.id, 'bishop', 0);
    await mockService.moveTask(task.id, 'rook', 0);
    await mockService.moveTask(task.id, 'queen', 0);
    const result = await mockService.moveTask(task.id, 'king', 0);
    expect(result.success).toBe(true);
    expect(result.isVictory).toBe(true);
    expect(result.ratingDelta).toBe(1);
  });

  test('updateTask modifies title and tags', async () => {
    const task = await mockService.createTask(boardId, 'Original title');
    const updated = await mockService.updateTask(task.id, {
      title: 'Updated title',
      tags: ['New', 'Tags'],
    });
    expect(updated.title).toBe('Updated title');
    expect(updated.tags).toEqual(['New', 'Tags']);
  });

  test('deleteTask removes task from board', async () => {
    const task = await mockService.createTask(boardId, 'Delete me');
    await mockService.deleteTask(task.id);
    const tasks = await mockService.getTasksByBoard(boardId);
    expect(tasks.find(t => t.id === task.id)).toBeUndefined();
  });
});

describe('mockService — player stats', () => {
  beforeEach(async () => {
    await mockService.login('kasparov@chesskanban.app', 'KingMe2026!');
  });

  test('getPlayerStats returns expected shape', async () => {
    const stats = await mockService.getPlayerStats();
    expect(stats.user).toBeDefined();
    expect(typeof stats.totalCompleted).toBe('number');
    expect(typeof stats.totalBoards).toBe('number');
    expect(stats.tasksByStage).toBeDefined();
    expect(stats.recentMoves).toBeInstanceOf(Array);
  });

  test('tasksByStage contains all six stages', async () => {
    const stats = await mockService.getPlayerStats();
    STAGES.forEach(stage => {
      expect(stats.tasksByStage[stage]).toBeDefined();
    });
  });
});