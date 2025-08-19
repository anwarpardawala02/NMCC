import { supabase } from './supabaseClient';

export interface Player {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url?: string;
  join_date: string;
  active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Photo {
  id: string;
  title?: string;
  url: string;
  description?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_id?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author?: Player;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  kind: 'revenue' | 'expense';
}

export interface Transaction {
  id: string;
  player_id?: string;
  category_id: string;
  kind: 'revenue' | 'expense';
  amount: number;
  occurred_on: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  player?: Player;
  category?: Category;
}

export interface Match {
  id: string;
  opponent: string;
  match_date: string;
  match_time?: string;
  venue: string;
  match_type: 'league' | 'friendly' | 'cup' | 'tournament';
  home_away: 'home' | 'away';
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface MatchAvailability {
  id: string;
  match_id: string;
  player_id: string;
  available: boolean;
  notes?: string;
  created_at: string;
  player?: Player;
  match?: Match;
}

export interface PlayerStatistics {
  id: string;
  player_id: string;
  season: string;
  matches_played: number;
  runs_scored: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  wickets_taken: number;
  overs_bowled: number;
  runs_conceded: number;
  catches: number;
  stumpings: number;
  player?: Player;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: string[];
  votes: Record<string, string>;
  created_by?: string;
  expires_at?: string;
  active: boolean;
  created_at: string;
}

// Player functions
export async function registerPlayer(data: Omit<Player, 'id' | 'join_date' | 'active' | 'is_admin' | 'created_at'>) {
  const { data: player, error } = await supabase
    .from('players')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return player;
}

export async function listPlayers(full = false): Promise<Player[]> {
  const columns = full ? '*' : 'id,full_name,join_date,active,photo_url';
  const res = await supabase.from('players').select(columns).eq('active', true);
  if (res.error) throw res.error;
  return res.data as unknown as Player[];
}

export async function getPlayer(id: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Photo functions
export async function listPhotos(): Promise<Photo[]> {
  const res = await supabase
    .from('photos')
    .select('*')
    .order('uploaded_at', { ascending: false });
  if (res.error) throw res.error;
  return res.data as Photo[];
}

export async function uploadPhoto(file: File, title?: string, description?: string) {
  const fileName = `${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('club-photos')
    .upload(fileName, file);
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage
    .from('club-photos')
    .getPublicUrl(fileName);
  const url = pub.publicUrl;

  const { data, error } = await supabase
    .from('photos')
    .insert({
      title: title || file.name,
      description,
      url,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Blog functions
export async function listBlogs(publishedOnly = true): Promise<Blog[]> {
  let query = supabase
    .from('blogs')
    .select('*, author:players(id,full_name)')
    .order('created_at', { ascending: false });
  
  if (publishedOnly) {
    query = query.eq('published', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Blog[];
}

export async function getBlog(id: string): Promise<Blog> {
  const { data, error } = await supabase
    .from('blogs')
    .select('*, author:players(id,full_name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createBlog(blog: Omit<Blog, 'id' | 'created_at' | 'updated_at' | 'author'>) {
  const { data, error } = await supabase
    .from('blogs')
    .insert([{
      ...blog,
      author_id: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Sponsor functions
export async function listSponsors(): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('active', true)
    .order('tier', { ascending: true });
  if (error) throw error;
  return data as Sponsor[];
}

export async function createSponsor(sponsor: Omit<Sponsor, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('sponsors')
    .insert([sponsor])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Financial functions
export async function listCategories(): Promise<Category[]> {
  const res = await supabase
    .from('categories')
    .select('*')
    .order('kind')
    .order('name');
  if (res.error) throw res.error;
  return res.data as Category[];
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'created_by'>) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      ...tx,
      created_by: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listTransactions(filters: { month?: string; kind?: string } = {}) {
  let query = supabase
    .from('transactions')
    .select('*, player:players(id,full_name), category:categories(id,name,kind)')
    .order('occurred_on', { ascending: false });

  if (filters.month) {
    query = query
      .gte('occurred_on', `${filters.month}-01`)
      .lt('occurred_on', `${filters.month}-32`);
  }
  if (filters.kind) {
    query = query.eq('kind', filters.kind);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Match functions
export async function listMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true });
  if (error) throw error;
  return data as Match[];
}

export async function createMatch(match: Omit<Match, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('matches')
    .insert([match])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMatchAvailability(matchId: string) {
  const { data, error } = await supabase
    .from('match_availability')
    .select('*, player:players(id,full_name)')
    .eq('match_id', matchId);
  if (error) throw error;
  return data;
}

export async function setMatchAvailability(matchId: string, playerId: string, available: boolean, notes?: string) {
  const { data, error } = await supabase
    .from('match_availability')
    .upsert({
      match_id: matchId,
      player_id: playerId,
      available,
      notes
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Statistics functions
export async function listPlayerStatistics(season?: string): Promise<PlayerStatistics[]> {
  let query = supabase
    .from('player_statistics')
    .select('*, player:players(id,full_name)');
  
  if (season) {
    query = query.eq('season', season);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as PlayerStatistics[];
}

export async function updatePlayerStatistics(playerId: string, stats: Partial<PlayerStatistics>) {
  const currentYear = new Date().getFullYear().toString();
  const { data, error } = await supabase
    .from('player_statistics')
    .upsert({
      player_id: playerId,
      season: currentYear,
      ...stats,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Poll functions
export async function listPolls(): Promise<Poll[]> {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Poll[];
}

export async function createPoll(poll: Omit<Poll, 'id' | 'votes' | 'created_at'>) {
  const { data, error } = await supabase
    .from('polls')
    .insert([{
      ...poll,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      votes: {}
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function votePoll(pollId: string, option: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Must be authenticated to vote');

  const { data: poll, error: fetchError } = await supabase
    .from('polls')
    .select('votes')
    .eq('id', pollId)
    .single();
  if (fetchError) throw fetchError;

  const updatedVotes = { ...poll.votes, [user.id]: option };

  const { data, error } = await supabase
    .from('polls')
    .update({ votes: updatedVotes })
    .eq('id', pollId)
    .select()
    .single();
  if (error) throw error;
  return data;
}