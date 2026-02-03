import {
  User,
  UserRole,
  AuthResponse,
  RefereeProfile,
  RefereeStats,
  RefereeWithStats,
  League,
  Game,
  GameWithAssignments,
  Assignment,
  AvailabilitySlot,
  Rating,
  RefNote,
  FindRefRequest,
  FindRefResult,
  RefSearchParams,
} from '@/types';

// Configure your FastAPI backend URL here
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    register: async (
      email: string,
      password: string,
      role: UserRole,
      extraData?: Record<string, string>
    ): Promise<AuthResponse> => {
      return this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role, ...extraData }),
      });
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
      return this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    me: async (token: string): Promise<User> => {
      return this.request<User>('/auth/me', {}, token);
    },
  };

  // Referee endpoints
  refs = {
    getProfile: async (token: string): Promise<RefereeProfile> => {
      return this.request<RefereeProfile>('/refs/me', {}, token);
    },

    updateProfile: async (token: string, data: Partial<RefereeProfile>): Promise<RefereeProfile> => {
      return this.request<RefereeProfile>('/refs/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }, token);
    },

    getPublicProfile: async (refId: number, token?: string): Promise<RefereeProfile> => {
      return this.request<RefereeProfile>(`/refs/${refId}`, {}, token);
    },

    getStats: async (refId: number, token?: string): Promise<RefereeStats> => {
      return this.request<RefereeStats>(`/refs/${refId}/stats`, {}, token);
    },

    search: async (params: RefSearchParams, token: string): Promise<RefereeWithStats[]> => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      return this.request<RefereeWithStats[]>(`/refs/search?${queryParams}`, {}, token);
    },

    getAvailability: async (token: string): Promise<AvailabilitySlot[]> => {
      return this.request<AvailabilitySlot[]>('/refs/me/availability', {}, token);
    },

    addAvailability: async (token: string, startTime: string, endTime: string): Promise<AvailabilitySlot> => {
      return this.request<AvailabilitySlot>('/refs/me/availability', {
        method: 'POST',
        body: JSON.stringify({ start_time: startTime, end_time: endTime }),
      }, token);
    },

    deleteAvailability: async (token: string, slotId: number): Promise<void> => {
      return this.request<void>(`/refs/me/availability/${slotId}`, {
        method: 'DELETE',
      }, token);
    },

    getAssignments: async (token: string): Promise<Assignment[]> => {
      return this.request<Assignment[]>('/refs/me/assignments', {}, token);
    },

    respondToAssignment: async (
      token: string,
      assignmentId: number,
      response: 'accepted' | 'declined'
    ): Promise<Assignment> => {
      return this.request<Assignment>(`/refs/assignments/${assignmentId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      }, token);
    },
  };

  // League endpoints
  leagues = {
    getProfile: async (token: string): Promise<League> => {
      return this.request<League>('/leagues/me', {}, token);
    },

    updateProfile: async (token: string, data: Partial<League>): Promise<League> => {
      return this.request<League>('/leagues/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }, token);
    },
  };

  // Game endpoints
  games = {
    create: async (token: string, data: Omit<Game, 'id' | 'league_id' | 'status'>): Promise<Game> => {
      return this.request<Game>('/games', {
        method: 'POST',
        body: JSON.stringify(data),
      }, token);
    },

    list: async (token: string, status?: string): Promise<Game[]> => {
      const query = status ? `?status=${status}` : '';
      return this.request<Game[]>(`/games${query}`, {}, token);
    },

    get: async (token: string, gameId: number): Promise<GameWithAssignments> => {
      return this.request<GameWithAssignments>(`/games/${gameId}`, {}, token);
    },

    update: async (token: string, gameId: number, data: Partial<Game>): Promise<Game> => {
      return this.request<Game>(`/games/${gameId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, token);
    },

    requestRef: async (
      token: string,
      gameId: number,
      refereeId: number,
      role: 'center' | 'ar'
    ): Promise<Assignment> => {
      return this.request<Assignment>(`/games/${gameId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ referee_id: refereeId, role }),
      }, token);
    },

    getAssignments: async (token: string, gameId: number): Promise<Assignment[]> => {
      return this.request<Assignment[]>(`/games/${gameId}/assignments`, {}, token);
    },
  };

  // Rating endpoints
  ratings = {
    create: async (
      token: string,
      refereeId: number,
      gameId: number,
      score: number,
      comment: string
    ): Promise<Rating> => {
      return this.request<Rating>('/ratings', {
        method: 'POST',
        body: JSON.stringify({ referee_id: refereeId, game_id: gameId, score, comment }),
      }, token);
    },

    getForRef: async (refId: number, token?: string): Promise<Rating[]> => {
      return this.request<Rating[]>(`/refs/${refId}/ratings`, {}, token);
    },
  };

  // Notes endpoints
  notes = {
    create: async (
      token: string,
      refereeId: number,
      gameId: number,
      noteText: string,
      visibility: 'private_to_league' | 'global'
    ): Promise<RefNote> => {
      return this.request<RefNote>('/notes', {
        method: 'POST',
        body: JSON.stringify({ referee_id: refereeId, game_id: gameId, note_text: noteText, visibility }),
      }, token);
    },

    getForRef: async (refId: number, token: string): Promise<RefNote[]> => {
      return this.request<RefNote[]>(`/refs/${refId}/notes`, {}, token);
    },
  };

  // AI endpoints
  ai = {
    findRef: async (token: string, request: FindRefRequest): Promise<FindRefResult> => {
      return this.request<FindRefResult>('/ai/find-ref', {
        method: 'POST',
        body: JSON.stringify(request),
      }, token);
    },
  };
}

const apiClient = new ApiClient(API_BASE_URL);

// Export individual API modules for convenience
export const authApi = apiClient.auth;
export const refsApi = apiClient.refs;
export const leaguesApi = apiClient.leagues;
export const gamesApi = apiClient.games;
export const ratingsApi = apiClient.ratings;
export const notesApi = apiClient.notes;
export const aiApi = apiClient.ai;

export default apiClient;
