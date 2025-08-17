import { supabase } from './supabaseClient';

export interface Player {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  join_date: string;
  active: boolean;
  photo_url?: string;
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

export interface Photo {
  id: string;
  title?: string;
  url: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export async function registerPlayer(data: Omit<Player, 'id' | 'join_date' | 'active'>) {
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
  const res = await supabase.from('players').select(columns);
  if (res.error) throw res.error;
  return (res.data as unknown) as Player[];
}

export async function listCategories(): Promise<Category[]> {
  const res = await supabase.from('categories').select('*').order('kind').order('name');
  if (res.error) throw res.error;
  return (res.data as unknown) as Category[];
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'created_by'>) {
  const res = await supabase.from('transactions').insert([tx]).select().single();
  if (res.error) throw res.error;
  return res.data as Transaction;
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

export async function getPlayerWithTransactions(playerId: string) {
  const { data: player, error } = await supabase
    .from('players')
    .select('*, transactions(*, category:categories(id,name,kind))')
    .eq('id', playerId)
    .single();
  if (error) throw error;
  return player;
}

export async function listPhotos() {
  const res = await supabase.from('photos').select('*').order('uploaded_at', { ascending: false });
  if (res.error) throw res.error;
  return (res.data as unknown) as Photo[];
}

export async function uploadPhoto({ file, title, userId }: { file: File; title: string; userId: string }) {
  const filePath = `${userId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage.from('club-photos').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from('club-photos').getPublicUrl(filePath);
  const publicUrl = (pub as any)?.publicUrl;

  const res = await supabase.from('photos').insert([{ title, url: publicUrl, uploaded_by: userId }]).select().single();
  if (res.error) throw res.error;
  return res.data as Photo;
}
