import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://rgxeownxdcdqqxisklzu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneGVvd254ZGNkcXF4aXNrbHp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ5NTExMiwiZXhwIjoyMDkwMDcxMTEyfQ.Jw_-T3aw8DeIW_enDpnmc096qFcFtxYyaFEXoBIo_lc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function research() {
  console.log('--- Fetching Tables ---')
  // Using the new 'postgres' schema introspection if available, 
  // but since we only have the REST API, we'll try to fetch OpenAPI
  const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  })
  
  if (!resp.ok) {
    console.error('Failed to fetch schema:', await resp.text())
    return
  }

  const schema = await resp.json()
  fs.writeFileSync('schema_definitions.json', JSON.stringify(schema.definitions, null, 2))
  fs.writeFileSync('schema_paths.json', JSON.stringify(schema.paths, null, 2))
  console.log('Tables found:', Object.keys(schema.definitions))
  const rpcs = Object.keys(schema.paths).filter(path => path.startsWith('/rpc/'))
  console.log('RPCs found:', rpcs)
}

research()
