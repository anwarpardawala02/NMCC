import { supabase } from './supabaseClient';

export async function uploadPhoto(file: File, title?: string) {
  const fileName = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from('club-photos').upload(fileName, file);
  if (error) throw error;

  const { data: pub } = supabase.storage.from('club-photos').getPublicUrl(fileName);
  const url = (pub as any)?.publicUrl;

  const res = await supabase.from('photos').insert({ title: title ?? file.name, url });
  if (res.error) throw res.error;

  return url;
}
