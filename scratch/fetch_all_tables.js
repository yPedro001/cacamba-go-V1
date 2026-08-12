const SUPABASE_URL = 'https://rgxeownxdcdqqxisklzu.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneGVvd254ZGNkcXF4aXNrbHp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ5NTExMiwiZXhwIjoyMDkwMDcxMTEyfQ.Jw_-T3aw8DeIW_enDpnmc096qFcFtxYyaFEXoBIo_lc'

async function run() {
  const headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
  }

  const tables = ['clientes', 'cacambas', 'alugueis', 'gastos', 'perfis', 'locais_descarte']

  for (const table of tables) {
    console.log(`\n--- Fetching table: ${table} ---`)
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`
    const res = await fetch(url, { headers })
    if (res.ok) {
      const data = await res.json()
      console.log(`Rows found: ${data.length}`)
      if (data.length > 0) {
        console.log(JSON.stringify(data).substring(0, 500) + '...')
        
        // Search string for borghelix
        if (JSON.stringify(data).toLowerCase().includes('borghelix')) {
          console.log(`>>> MATCH FOUND FOR BORGHELIX IN ${table} <<<`)
        }
      }
    } else {
      console.log(`Table error: ${res.status} ${res.statusText}`)
    }
  }
}

run()
