import { supabase } from './supabaseClient';

export async function uploadPhoto(file: File, title?: string) {
  // Generate a unique ID for the photo
  const uniqueId = crypto.randomUUID();
  const fileName = `${uniqueId}-${file.name}`;
  
  // Convert file to base64 directly (avoiding storage bucket)
  const base64Data = await fileToBase64(file);
  
  // Store metadata in database with the base64 content
  const res = await supabase.from('photos').insert({ 
    title: title ?? file.name, 
    file_name: fileName,
    base64_data: base64Data,
    created_at: new Date()
  });
  
  if (res.error) throw res.error;

  // Return a generated URL that can be used to reference the photo
  return `/api/photos/${uniqueId}`;
}

// Helper function to convert a file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
