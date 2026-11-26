import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes ou placeholder. Configure .env.local'
  );
}

function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr =
      typeof window !== 'undefined' && typeof window.atob === 'function'
        ? window.atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr) as { role?: string };
  } catch {
    return null;
  }
}

export function isServiceRoleKey(key: string): boolean {
  const payload = decodeJwtPayload(key);
  return payload?.role === 'service_role';
}

if (supabaseKey && isServiceRoleKey(supabaseKey)) {
  console.warn(
    '[supabase] ATENÇÃO: NEXT_PUBLIC_SUPABASE_ANON_KEY parece ser service_role! Vazamento de chave privilegiada no client. Use a anon key.'
  );
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseKey !== 'placeholder'
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
