import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database Types
export interface User {
  id: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  full_name: string | null;
  id_card_hash: string | null;
  id_card_barcode: string | null;
  id_card_verified: boolean;
  id_card_image_url: string | null;
  registration_gps: { lat: number; lng: number; accuracy: number; timestamp: string } | null;
  registration_ip: string | null;
  device_fingerprint: string | null;
  created_at: string;
  last_login: string | null;
  is_blocked: boolean;
  // Role-based access control
  role: 'user' | 'admin' | 'moderator';
  // Additional profile fields
  user_type?: 'student' | 'teacher' | null;
  department?: string | null;
  year?: number | null;
  section?: string | null;
  club?: string | null;
  profile_completed?: boolean;
}

export interface VotingSession {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  criteria: {
    class?: string[];
    year?: number[];
    department?: string[];
    user_type?: ('student' | 'teacher')[];
  } | null;
  allowed_gps_radius: number | null;
  center_gps: { lat: number; lng: number } | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  minimum_duration: string | null;
  allow_multiple_votes: boolean;
  show_live_results: boolean;
  require_gps: boolean;
  max_votes_per_option: number | null;
  created_at: string;
  updated_at: string;
}

export interface VotingOption {
  id: string;
  session_id: string;
  option_text: string;
  option_image_url: string | null;
  option_order: number | null;
  additional_data: Record<string, any> | null;
  created_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  option_id: string;
  user_id: string;
  voted_at: string;
  gps_location: { lat: number; lng: number; accuracy: number };
  ip_address: string | null;
  device_fingerprint: string | null;
  user_agent: string | null;
  is_valid: boolean;
  invalidation_reason: string | null;
}
