import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Fail-fast: sem env vars o app nunca sairá da tela branca — avisa explicitamente
if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error('[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes ou placeholder. Configure .env.local')
}

function isServiceRoleKey(key: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString())
    return payload?.role === 'service_role'
  } catch { return false }
}

if (supabaseKey && isServiceRoleKey(supabaseKey)) {
  console.warn('[supabase] ATENÇÃO: NEXT_PUBLIC_SUPABASE_ANON_KEY parece ser service_role! Vazamento de chave privilegiada no client. Use a anon key.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder')

// Exemplo de como usar Realtime em um componente React (hook):
/*
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useCacambasRealtime() {
  const [cacambas, setCacambas] = useState([])

  useEffect(() => {
    // Busca inicial
    const fetchCacambas = async () => {
      const { data } = await supabase.from('cacambas').select('*')
      if (data) setCacambas(data)
    }
    fetchCacambas()

    // Inscreve para mudanças no banco em tempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cacambas' },
        (payload) => {
          console.log('Change received!', payload)
          fetchCacambas() // Recarrega os dados (ou faz update otimista no state)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return cacambas
}
*/
