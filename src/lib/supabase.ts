/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase URL and Anon Key from Vite environment variables, process.env, or fallback defaults
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') || 'https://gnxptdaendxwcypfupzk.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') || 'sb_publishable_SjRGp_uZVb07ZwCkTElmUQ_XevpquyP';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-supabase-project.supabase.co');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Upload an image file or blob to Supabase Storage.
 * @param file The File or Blob object to upload
 * @param bucket Primary name of the Supabase Storage bucket (default: 'images')
 * @param folder Optional folder path inside the bucket
 * @returns The public URL of the uploaded image or error details
 */
export async function uploadImageToSupabase(
  file: File | Blob,
  bucket = 'images',
  folder = 'products'
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      url: null,
      error: 'Supabase n\'est pas encore configuré avec URL et clé API.',
    };
  }

  const fileExt = file instanceof File ? file.name.split('.').pop() || 'png' : 'png';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  // Candidate buckets to try in sequence if default bucket is missing
  const candidateBuckets = Array.from(new Set([bucket, 'images', 'products', 'public', 'media', 'files']));

  for (const bkt of candidateBuckets) {
    try {
      const { data, error } = await supabase.storage
        .from(bkt)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(bkt)
          .getPublicUrl(data.path);

        return { url: publicUrlData.publicUrl, error: null };
      }

      // If bucket is missing, attempt to create it if client RLS allows, or move to next candidate
      if (error && (error.message.toLowerCase().includes('bucket not found') || error.message.toLowerCase().includes('not_found'))) {
        try {
          // Attempt bucket auto-creation
          const { error: createErr } = await supabase.storage.createBucket(bkt, { public: true });
          if (!createErr) {
            // Retry upload to newly created bucket
            const { data: retryData, error: retryErr } = await supabase.storage
              .from(bkt)
              .upload(fileName, file, { cacheControl: '3600', upsert: true });

            if (!retryErr && retryData) {
              const { data: publicUrlData } = supabase.storage
                .from(bkt)
                .getPublicUrl(retryData.path);
              return { url: publicUrlData.publicUrl, error: null };
            }
          }
        } catch {
          // Ignore auto-creation failure and proceed to next candidate bucket
        }
      }
    } catch (err: any) {
      console.warn(`Attempt failed on bucket '${bkt}':`, err);
    }
  }

  return {
    url: null,
    error: 'Bucket introuvable dans Supabase. Veuillez créer un bucket public nommé "images" dans le menu Storage de votre Dashboard Supabase.',
  };
}
