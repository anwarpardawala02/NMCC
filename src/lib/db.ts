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
  role?: 'player' | 'secretary' | 'treasurer' | 'admin';
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

// Fixtures Functions

// (Removed duplicate definitions at the top of the file)

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

export interface Fixture {
  id: string;
  opponent: string;
  fixture_date: string;
  fixture_time?: string;
  venue: string;
  home_away: 'home' | 'away';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
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

export interface Fixture {
  id: string;
  opponent: string;
  fixture_date: string; // maps from fixtures.date
  venue: string;        // maps from fixtures.ground
  home_away: 'home' | 'away'; // maps from 'Home' | 'Away'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

// Database row for fixtures table
type FixtureRow = {
  id: string;
  date: string;
  opponent: string | null;
  home_away: 'Home' | 'Away' | null;
  ground: string | null;
  notes: string | null;
};

function mapFixtureRowToFixture(r: FixtureRow): Fixture {
  return {
    id: r.id,
    opponent: r.opponent ?? '',
    fixture_date: r.date,
    venue: r.ground ?? '',
    home_away: (r.home_away?.toLowerCase() as 'home' | 'away') ?? 'home',
    status: 'scheduled',
    notes: r.notes ?? undefined,
    created_at: `${r.date}T00:00:00.000Z`
  };
}

function mapFixtureToRow(f: Omit<Fixture, 'id' | 'created_at'>): Partial<FixtureRow> {
  return {
    date: f.fixture_date,
    opponent: f.opponent,
    home_away: f.home_away === 'home' ? 'Home' : 'Away',
    ground: f.venue,
    notes: f.notes ?? null
  };
}

export interface Availability {
  id: string;
  fixture_id: string;
  player_id: string;
  status: 'Available' | 'Not Available';
  responded_on: string;
  player?: Player;
  fixture?: Fixture;
}

export interface Fee {
  id: string;
  player_id: string;
  fee_type: 'membership' | 'match' | 'training' | 'other';
  amount: number;
  due_date: string;
  paid: boolean;
  notes?: string;
  created_at: string;
  player?: Player;
}

// Club expenses table mapping
export interface Expense {
  id: string;
  date: string; // expense date
  description?: string;
  amount: number;
  category: 'Ground' | 'Lunch' | 'Chai' | 'Other';
}

// Player functions
export async function registerPlayer(data: Omit<Player, 'id' | 'join_date' | 'active' | 'is_admin' | 'created_at'> & { role?: string }) {
  // Ensure role is set to 'player' if not provided
  const playerData = { ...data, role: (data as any).role || 'player' };
  const { data: player, error } = await supabase
    .from('players')
    .insert([playerData])
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

// Fixture functions
export async function listFixtures(): Promise<Fixture[]> {
  const { data, error } = await supabase
    .from('fixtures')
    .select('id, date, opponent, home_away, ground, notes')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data as FixtureRow[]).map(mapFixtureRowToFixture);
}

export async function getFixture(id: string): Promise<Fixture> {
  const { data, error } = await supabase
    .from('fixtures')
    .select('id, date, opponent, home_away, ground, notes')
    .eq('id', id)
    .single();
  if (error) throw error;
  return mapFixtureRowToFixture(data as FixtureRow);
}

export async function createFixture(fixture: Omit<Fixture, 'id' | 'created_at'>): Promise<Fixture> {
  const row = mapFixtureToRow(fixture);
  const { data, error } = await supabase
    .from('fixtures')
    .insert([row])
    .select('id, date, opponent, home_away, ground, notes')
    .single();
  if (error) throw error;
  return mapFixtureRowToFixture(data as FixtureRow);
}

export async function updateFixture(id: string, updates: Partial<Fixture>): Promise<Fixture> {
  const row = mapFixtureToRow(updates as Omit<Fixture, 'id' | 'created_at'>);
  const { data, error } = await supabase
    .from('fixtures')
    .update(row)
    .eq('id', id)
    .select('id, date, opponent, home_away, ground, notes')
    .single();
  if (error) throw error;
  return mapFixtureRowToFixture(data as FixtureRow);
}

export async function deleteFixture(id: string): Promise<void> {
  const { error } = await supabase
    .from('fixtures')
    .delete()
    .eq('id', id);
  if (error) throw error;
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

// Fixtures Functions

// (Removed duplicate definitions at the end of the file)

// Fees Functions
export async function createFee(feeData: Omit<Fee, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('fees')
    .insert([feeData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listFees(): Promise<Fee[]> {
  const { data, error } = await supabase
    .from('fees')
    .select('*, player:player_id(*)')
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data as Fee[];
}

// Expenses Functions
export async function createExpense(expenseData: Omit<Expense, 'id'>) {
  const { data, error } = await supabase
    .from('club_expenses')
    .insert([expenseData])
    .select()
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('club_expenses')
    .select('id, date, description, amount, category')
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

// Availability Functions
export async function setAvailability(fixtureId: string, playerId: string, status: 'Available' | 'Not Available') {
  const { data, error } = await supabase
    .from('availability')
    .upsert(
      {
        fixture_id: fixtureId,
        player_id: playerId,
        status,
      },
      { onConflict: 'fixture_id,player_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFixtureAvailability(fixtureId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availability')
  .select('*, player:players(id, full_name, photo_url)')
    .eq('fixture_id', fixtureId);
  if (error) throw error;
  return data as Availability[];
}

export async function getPlayerAvailability(playerId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('*, fixture:fixtures(*)')
    .eq('player_id', playerId);
  if (error) throw error;
  return data as Availability[];
}

export async function getFixtureWithAvailability(fixtureId: string): Promise<Fixture & { available_count: number; not_available_count: number }> {
  // Get fixture details (select specific columns and map)
  const { data: fixtureRow, error: fixtureError } = await supabase
    .from('fixtures')
    .select('id, date, opponent, home_away, ground, notes')
    .eq('id', fixtureId)
    .single();
  
  if (fixtureError) throw fixtureError;
  
  // Get availability counts
  const { data: availablePlayers, error: availableError } = await supabase
    .from('availability')
    .select('id')
    .eq('fixture_id', fixtureId)
    .eq('status', 'Available');
    
  if (availableError) throw availableError;
  
  const { data: notAvailablePlayers, error: notAvailableError } = await supabase
    .from('availability')
    .select('id')
    .eq('fixture_id', fixtureId)
    .eq('status', 'Not Available');
    
  if (notAvailableError) throw notAvailableError;
  
  const mapped = mapFixtureRowToFixture(fixtureRow as FixtureRow);
  return {
    ...mapped,
    available_count: availablePlayers.length,
    not_available_count: notAvailablePlayers.length
  };
}