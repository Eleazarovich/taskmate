import type { IChessKanbanService } from './IChessKanbanService';
import type {
  AuthResult,
  Board,
  MoveResult,
  PlayerStats,
  Priority,
  Stage,
  Task,
  User,
} from '../types';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'taskmate_access_token';

type ErrorBody = {
  error?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function isAuthResult(value: unknown): value is AuthResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof value.success === 'boolean'
  );
}

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeAccessToken(token: string | undefined): void {
  if (typeof window === 'undefined' || !token) return;

  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // The http-only session cookie remains available when storage is blocked.
  }
}

function clearStoredAccessToken(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Ignore storage failures; the server-side session is still authoritative.
  }
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || undefined;
}

function errorMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const error = (body as ErrorBody).error;
    if (typeof error === 'string') return error;
  }

  return `Request failed with status ${status}.`;
}

class ApiService implements IChessKanbanService {
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = getStoredAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
    const body = await readBody(response);

    if (!response.ok) {
      if (response.status === 401) clearStoredAccessToken();
      throw new ApiError(response.status, errorMessage(body, response.status), body);
    }

    return body as T;
  }

  private async authRequest(
    path: '/auth/login' | '/auth/signup',
    body: Record<string, string>,
  ): Promise<AuthResult> {
    try {
      const result = await this.request<AuthResult>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      storeAccessToken(result.accessToken);
      return result;
    } catch (error) {
      // Invalid credentials and duplicate signups are returned as AuthResult
      // error responses by the backend and are displayed inline by the forms.
      if (error instanceof ApiError && isAuthResult(error.body)) {
        return error.body;
      }
      throw error;
    }
  }

  async signUp(name: string, email: string, password: string): Promise<AuthResult> {
    return this.authRequest('/auth/signup', { name, email, password });
  }

  async login(email: string, password: string): Promise<AuthResult> {
    return this.authRequest('/auth/login', { email, password });
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout', { method: 'POST' });
    } finally {
      clearStoredAccessToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.request<User | null>('/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  }

  async getBoards(): Promise<Board[]> {
    return this.request<Board[]>('/boards');
  }

  async createBoard(name: string): Promise<Board> {
    return this.request<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteBoard(boardId: string): Promise<void> {
    await this.request<void>(`/boards/${encodeURIComponent(boardId)}`, {
      method: 'DELETE',
    });
  }

  async getTasksByBoard(boardId: string): Promise<Task[]> {
    return this.request<Task[]>(
      `/boards/${encodeURIComponent(boardId)}/tasks`,
    );
  }

  async createTask(
    boardId: string,
    title: string,
    opts: {
      description?: string;
      priority?: Priority;
      dueDate?: string;
      tags?: string[];
    } = {},
  ): Promise<Task> {
    return this.request<Task>(
      `/boards/${encodeURIComponent(boardId)}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify({ title, ...opts }),
      },
    );
  }

  async updateTask(
    taskId: string,
    updates: Partial<
      Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'tags'>
    >,
  ): Promise<Task> {
    const body: Record<string, unknown> = { ...updates };

    // The UI uses undefined to mean "clear this optional field". Explicit
    // null tells the API to clear it, while omitted fields remain unchanged.
    for (const field of ['description', 'priority', 'dueDate']) {
      if (field in body && body[field] === undefined) body[field] = null;
    }

    return this.request<Task>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.request<void>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: 'DELETE',
    });
  }

  async moveTask(
    taskId: string,
    toStage: Stage,
    newPosition: number,
  ): Promise<MoveResult> {
    return this.request<MoveResult>(
      `/tasks/${encodeURIComponent(taskId)}/move`,
      {
        method: 'PATCH',
        body: JSON.stringify({ toStage, newPosition }),
      },
    );
  }

  async reorderTask(taskId: string, newPosition: number): Promise<void> {
    await this.request<void>(
      `/tasks/${encodeURIComponent(taskId)}/reorder`,
      {
        method: 'PATCH',
        body: JSON.stringify({ newPosition }),
      },
    );
  }

  async getPlayerStats(): Promise<PlayerStats> {
    return this.request<PlayerStats>('/player/stats');
  }
}

export const apiService: IChessKanbanService = new ApiService();
