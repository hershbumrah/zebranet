// User and Auth Types
export type UserRole = 'referee' | 'league';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  profile_image_url?: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Referee Types
export interface RefereeProfile {
  id: number;
  user_id: number;
  full_name: string;
  cert_level: string;
  years_experience: number;
  primary_positions: string;
  home_location: string;
  latitude?: number;
  longitude?: number;
  travel_radius_km: number;
  bio: string;
}

export interface RefereeStats {
  total_games: number;
  average_rating: number;
  recent_notes: RefNote[];
}

export interface RefereeWithStats extends RefereeProfile {
  stats: RefereeStats;
}

// League Types
export interface League {
  id: number;
  user_id: number;
  name: string;
  primary_region: string;
  level: string;
}

// Game Types
export type GameStatus = 'open' | 'pending_assignment' | 'assigned' | 'completed';

export interface Game {
  id: number;
  league_id: number;
  location: string;
  latitude?: number;
  longitude?: number;
  scheduled_start: string;
  age_group: string;
  competition_level: string;
  status: GameStatus;
  center_fee: number;
  ar_fee: number;
}

export interface GameWithAssignments extends Game {
  assignments: Assignment[];
}

// Assignment Types
export type AssignmentRole = 'center' | 'ar';
export type AssignmentStatus = 'requested' | 'accepted' | 'declined' | 'cancelled';

export interface Assignment {
  id: number;
  game_id: number;
  referee_id: number;
  role: AssignmentRole;
  status: AssignmentStatus;
  assigned_at: string;
  responded_at?: string;
  referee?: RefereeProfile;
  game?: Game;
}

// Rating Types
export interface Rating {
  id: number;
  league_id: number;
  referee_id: number;
  game_id: number;
  score: number;
  comment: string;
  created_at: string;
}

// Note Types
export type NoteVisibility = 'private_to_league' | 'global';

export interface RefNote {
  id: number;
  league_id: number;
  referee_id: number;
  game_id: number;
  note_text: string;
  visibility: NoteVisibility;
  created_at: string;
}

// Availability Types
export interface AvailabilitySlot {
  id: number;
  referee_id: number;
  start_time: string;
  end_time: string;
}

// AI Types
export interface FindRefRequest {
  natural_language_query: string;
  game_id?: number;
}

export interface FindRefResult {
  suggested_ref_ids: number[];
  explanation: string;
  suggested_refs?: RefereeWithStats[];
}

// Search Types
export interface RefSearchParams {
  location?: string;
  radius_km?: number;
  min_rating?: number;
  age_group?: string;
  competition_level?: string;
  available_start?: string;
  available_end?: string;
}

export interface RefereeLookup {
  user_id: number;
  referee_id: number;
  full_name?: string;
  email: string;
  cert_level?: string;
  home_location?: string;
  profile_image_url?: string | null;
}

// Message Types
export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  game_id?: number;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  sender_email?: string;
  sender_name?: string;
  recipient_email?: string;
  recipient_name?: string;
}

export interface ConversationParticipant {
  user_id: number;
  email: string;
  name?: string;
  role: 'referee' | 'league';
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface MessageCreate {
  recipient_id: number;
  content: string;
  game_id?: number;
}

// AI Chat Types
export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface AIChatResponse {
  response: string;
  actions: Array<{
    function: string;
    arguments: Record<string, any>;
    result: any;
  }>;
  function_calls: boolean;
}

