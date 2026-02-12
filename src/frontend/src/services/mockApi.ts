// Mock API for development/demo purposes
// Replace with real API calls when backend is ready

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

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage
let mockUsers: User[] = [
  { id: 1, email: 'ref@demo.com', role: 'referee', created_at: '2024-01-01T00:00:00Z' },
  { id: 2, email: 'league@demo.com', role: 'league', created_at: '2024-01-01T00:00:00Z' },
];

let mockReferees: RefereeProfile[] = [
  {
    id: 1,
    user_id: 1,
    full_name: 'John Smith',
    cert_level: 'Grade 6',
    years_experience: 8,
    primary_positions: 'center, ar',
    home_location: 'Edison, NJ',
    latitude: 40.5187,
    longitude: -74.4121,
    travel_radius_km: 40,
    bio: 'Experienced referee with a passion for youth development. USSF certified.',
  },
  {
    id: 2,
    user_id: 3,
    full_name: 'Maria Garcia',
    cert_level: 'Grade 5',
    years_experience: 12,
    primary_positions: 'center',
    home_location: 'Newark, NJ',
    latitude: 40.7357,
    longitude: -74.1724,
    travel_radius_km: 50,
    bio: 'Former collegiate player turned referee. Specializing in competitive matches.',
  },
  {
    id: 3,
    user_id: 4,
    full_name: 'David Chen',
    cert_level: 'Grade 7',
    years_experience: 3,
    primary_positions: 'ar',
    home_location: 'Princeton, NJ',
    latitude: 40.3573,
    longitude: -74.6672,
    travel_radius_km: 30,
    bio: 'Enthusiastic new referee eager to learn and grow in the sport.',
  },
];

let mockLeagues: League[] = [
  {
    id: 1,
    user_id: 2,
    name: 'Central Jersey Soccer League',
    primary_region: 'Central NJ',
    level: 'youth',
  },
];

let mockGames: Game[] = [
  {
    id: 1,
    league_id: 1,
    location: 'Edison High School, Edison, NJ',
    latitude: 40.5187,
    longitude: -74.4121,
    scheduled_start: '2024-03-15T14:00:00Z',
    age_group: 'U15',
    competition_level: 'travel',
    status: 'open',
    center_fee: 65,
    ar_fee: 45,
  },
  {
    id: 2,
    league_id: 1,
    location: 'Mercer County Park, West Windsor, NJ',
    latitude: 40.2892,
    longitude: -74.6249,
    scheduled_start: '2024-03-16T10:00:00Z',
    age_group: 'U12',
    competition_level: 'recreational',
    status: 'assigned',
    center_fee: 55,
    ar_fee: 40,
  },
];

let mockAssignments: Assignment[] = [
  {
    id: 1,
    game_id: 2,
    referee_id: 1,
    role: 'center',
    status: 'accepted',
    assigned_at: '2024-03-01T10:00:00Z',
    responded_at: '2024-03-01T12:00:00Z',
  },
];

let mockRatings: Rating[] = [
  {
    id: 1,
    league_id: 1,
    referee_id: 1,
    game_id: 2,
    score: 5,
    comment: 'Excellent game control and communication with players.',
    created_at: '2024-02-20T15:00:00Z',
  },
  {
    id: 2,
    league_id: 1,
    referee_id: 1,
    game_id: 2,
    score: 4,
    comment: 'Good positioning throughout the match.',
    created_at: '2024-02-15T16:00:00Z',
  },
];

let mockNotes: RefNote[] = [
  {
    id: 1,
    league_id: 1,
    referee_id: 1,
    game_id: 2,
    note_text: 'Very professional, arrived early and prepared well.',
    visibility: 'global',
    created_at: '2024-02-20T15:30:00Z',
  },
];

let mockAvailability: AvailabilitySlot[] = [
  {
    id: 1,
    referee_id: 1,
    start_time: '2024-03-15T08:00:00Z',
    end_time: '2024-03-15T18:00:00Z',
  },
  {
    id: 2,
    referee_id: 1,
    start_time: '2024-03-16T08:00:00Z',
    end_time: '2024-03-16T14:00:00Z',
  },
];

// Helper to generate tokens
const generateToken = (userId: number): string => {
  return btoa(JSON.stringify({ userId, exp: Date.now() + 86400000 }));
};

const decodeToken = (token: string): { userId: number } | null => {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
};

// Mock Auth API
export const mockAuthApi = {
  register: async (
    email: string,
    password: string,
    role: UserRole,
    extraData?: Record<string, string>
  ): Promise<AuthResponse> => {
    await delay(500);
    
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const newUser: User = {
      id: mockUsers.length + 1,
      email,
      role,
      created_at: new Date().toISOString(),
    };
    mockUsers.push(newUser);

    if (role === 'referee') {
      mockReferees.push({
        id: mockReferees.length + 1,
        user_id: newUser.id,
        full_name: '',
        cert_level: '',
        years_experience: 0,
        primary_positions: '',
        home_location: '',
        travel_radius_km: 25,
        bio: '',
      });
    } else if (role === 'league') {
      mockLeagues.push({
        id: mockLeagues.length + 1,
        user_id: newUser.id,
        name: extraData?.name || '',
        primary_region: extraData?.primary_region || '',
        level: extraData?.level || 'youth',
      });
    }

    return {
      access_token: generateToken(newUser.id),
      token_type: 'bearer',
      user: newUser,
    };
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    await delay(500);
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    return {
      access_token: generateToken(user.id),
      token_type: 'bearer',
      user,
    };
  },

  me: async (token: string): Promise<User> => {
    await delay(200);
    
    const decoded = decodeToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const user = mockUsers.find(u => u.id === decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
};

// Mock Refs API
export const mockRefsApi = {
  getProfile: async (token: string): Promise<RefereeProfile> => {
    await delay(300);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const ref = mockReferees.find(r => r.user_id === decoded.userId);
    if (!ref) throw new Error('Referee profile not found');

    return ref;
  },

  updateProfile: async (token: string, data: Partial<RefereeProfile>): Promise<RefereeProfile> => {
    await delay(400);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const refIndex = mockReferees.findIndex(r => r.user_id === decoded.userId);
    if (refIndex === -1) throw new Error('Referee profile not found');

    mockReferees[refIndex] = { ...mockReferees[refIndex], ...data };
    return mockReferees[refIndex];
  },

  getPublicProfile: async (refId: number): Promise<RefereeProfile> => {
    await delay(300);
    
    const ref = mockReferees.find(r => r.id === refId);
    if (!ref) throw new Error('Referee not found');

    return ref;
  },

  getStats: async (refId: number): Promise<RefereeStats> => {
    await delay(300);
    
    const ratings = mockRatings.filter(r => r.referee_id === refId);
    const assignments = mockAssignments.filter(
      a => a.referee_id === refId && a.status === 'accepted'
    );
    const notes = mockNotes.filter(n => n.referee_id === refId).slice(0, 5);

    return {
      total_games: assignments.length,
      average_rating: ratings.length
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0,
      recent_notes: notes,
    };
  },

  search: async (params: RefSearchParams): Promise<RefereeWithStats[]> => {
    await delay(500);
    
    let results = [...mockReferees];

    // Basic filtering (simplified for mock)
    if (params.min_rating) {
      results = results.filter(ref => {
        const ratings = mockRatings.filter(r => r.referee_id === ref.id);
        const avg = ratings.length
          ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
          : 0;
        return avg >= params.min_rating!;
      });
    }

    return Promise.all(
      results.map(async ref => {
        const stats = await mockRefsApi.getStats(ref.id);
        return { ...ref, stats };
      })
    );
  },

  getAvailability: async (token: string): Promise<AvailabilitySlot[]> => {
    await delay(300);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const ref = mockReferees.find(r => r.user_id === decoded.userId);
    if (!ref) throw new Error('Referee not found');

    return mockAvailability.filter(a => a.referee_id === ref.id);
  },

  addAvailability: async (
    token: string,
    startTime: string,
    endTime: string
  ): Promise<AvailabilitySlot> => {
    await delay(400);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const ref = mockReferees.find(r => r.user_id === decoded.userId);
    if (!ref) throw new Error('Referee not found');

    const newSlot: AvailabilitySlot = {
      id: mockAvailability.length + 1,
      referee_id: ref.id,
      start_time: startTime,
      end_time: endTime,
    };
    mockAvailability.push(newSlot);

    return newSlot;
  },

  deleteAvailability: async (token: string, slotId: number): Promise<void> => {
    await delay(300);
    
    const index = mockAvailability.findIndex(a => a.id === slotId);
    if (index !== -1) {
      mockAvailability.splice(index, 1);
    }
  },

  getAssignments: async (token: string): Promise<Assignment[]> => {
    await delay(400);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const ref = mockReferees.find(r => r.user_id === decoded.userId);
    if (!ref) throw new Error('Referee not found');

    return mockAssignments
      .filter(a => a.referee_id === ref.id)
      .map(a => ({
        ...a,
        game: mockGames.find(g => g.id === a.game_id),
      }));
  },

  respondToAssignment: async (
    token: string,
    assignmentId: number,
    response: 'accepted' | 'declined'
  ): Promise<Assignment> => {
    await delay(400);
    
    const index = mockAssignments.findIndex(a => a.id === assignmentId);
    if (index === -1) throw new Error('Assignment not found');

    mockAssignments[index] = {
      ...mockAssignments[index],
      status: response,
      responded_at: new Date().toISOString(),
    };

    return mockAssignments[index];
  },
};

// Mock Leagues API
export const mockLeaguesApi = {
  getProfile: async (token: string): Promise<League> => {
    await delay(300);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const league = mockLeagues.find(l => l.user_id === decoded.userId);
    if (!league) throw new Error('League not found');

    return league;
  },

  updateProfile: async (token: string, data: Partial<League>): Promise<League> => {
    await delay(400);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const index = mockLeagues.findIndex(l => l.user_id === decoded.userId);
    if (index === -1) throw new Error('League not found');

    mockLeagues[index] = { ...mockLeagues[index], ...data };
    return mockLeagues[index];
  },
};

// Mock Games API
export const mockGamesApi = {
  create: async (
    token: string,
    data: Omit<Game, 'id' | 'league_id' | 'status'>
  ): Promise<Game> => {
    await delay(500);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const league = mockLeagues.find(l => l.user_id === decoded.userId);
    if (!league) throw new Error('League not found');

    const newGame: Game = {
      id: mockGames.length + 1,
      league_id: league.id,
      status: 'open',
      ...data,
    };
    mockGames.push(newGame);

    return newGame;
  },

  list: async (token: string, status?: string): Promise<Game[]> => {
    await delay(400);
    
    const decoded = decodeToken(token);
    if (!decoded) throw new Error('Invalid token');

    const league = mockLeagues.find(l => l.user_id === decoded.userId);
    if (!league) throw new Error('League not found');

    let games = mockGames.filter(g => g.league_id === league.id);
    if (status) {
      games = games.filter(g => g.status === status);
    }

    return games;
  },

  get: async (token: string, gameId: number): Promise<GameWithAssignments> => {
    await delay(300);
    
    const game = mockGames.find(g => g.id === gameId);
    if (!game) throw new Error('Game not found');

    const assignments = mockAssignments
      .filter(a => a.game_id === gameId)
      .map(a => ({
        ...a,
        referee: mockReferees.find(r => r.id === a.referee_id),
      }));

    return { ...game, assignments };
  },

  update: async (token: string, gameId: number, data: Partial<Game>): Promise<Game> => {
    await delay(400);
    
    const index = mockGames.findIndex(g => g.id === gameId);
    if (index === -1) throw new Error('Game not found');

    mockGames[index] = { ...mockGames[index], ...data };
    return mockGames[index];
  },

  requestRef: async (
    token: string,
    gameId: number,
    refereeId: number,
    role: 'center' | 'ar'
  ): Promise<Assignment> => {
    await delay(500);
    
    const newAssignment: Assignment = {
      id: mockAssignments.length + 1,
      game_id: gameId,
      referee_id: refereeId,
      role,
      status: 'requested',
      assigned_at: new Date().toISOString(),
    };
    mockAssignments.push(newAssignment);

    // Update game status
    const gameIndex = mockGames.findIndex(g => g.id === gameId);
    if (gameIndex !== -1) {
      mockGames[gameIndex].status = 'pending_assignment';
    }

    return newAssignment;
  },

  getAssignments: async (token: string, gameId: number): Promise<Assignment[]> => {
    await delay(300);
    
    return mockAssignments
      .filter(a => a.game_id === gameId)
      .map(a => ({
        ...a,
        referee: mockReferees.find(r => r.id === a.referee_id),
      }));
  },
};

// Mock AI API
export const mockAiApi = {
  findRef: async (token: string, request: FindRefRequest): Promise<FindRefResult> => {
    await delay(1500); // Simulate AI processing time
    
    // Simple mock that returns top refs
    const allRefs = await mockRefsApi.search({});
    const topRefs = allRefs.slice(0, 3);

    return {
      suggested_ref_ids: topRefs.map(r => r.id),
      explanation: `Based on your request "${request.natural_language_query}", I found ${topRefs.length} referees who match your criteria. They are within your specified travel radius, have good ratings, and are available for the requested time.`,
      suggested_refs: topRefs,
    };
  },
};
