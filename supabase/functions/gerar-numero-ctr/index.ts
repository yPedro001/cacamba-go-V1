import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  const { p_usuario_id } = await req.json()

  try {
    // Gerar próximo número CTR
    const now = new Date()
    const ano = now.getFullYear()
    
    // Buscar ou criar sequencial
    const { data: seqData } = await supabase
      .from('ctr_sequenciais')
      .select('ultimo_numero')
      .eq('usuario_id', p_usuario_id)
      .eq('ano', ano)
      .single()

    let proximoNumero = 1
    if (seqData) {
      proximoNumero = seqData.ultimo_numero + 1
      await supabase
        .from('ctr_sequenciais')
        .update({ ultimo_numero: proximoNumero })
        .eq('usuario_id', p_usuario_id)
        .eq('ano', ano)
    } else {
      await supabase
        .from('ctr_sequenciais')
        .insert({ usuario_id: p_usuario_id, ano, ultimo_numero: 1 })
    }

    const numero = proximoNumero.toString().padStart(6, '0')

    return new Response(JSON.stringify(numero), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})