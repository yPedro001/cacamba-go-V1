import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey)

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
