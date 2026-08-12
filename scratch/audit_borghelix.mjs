import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rgxeownxdcdqqxisklzu.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneGVvd254ZGNkcXF4aXNrbHp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ5NTExMiwiZXhwIjoyMDkwMDcxMTEyfQ.Jw_-T3aw8DeIW_enDpnmc096qFcFtxYyaFEXoBIo_lc'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function run() {
  console.log('--- AUDITING SUPABASE ---')
  const email = 'Borghelixcacambas@gmail.com'
  
  console.log('1. Checking auth.users via admin API')
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers()
  if (usersErr) {
    console.error('Error listing users:', usersErr.message)
  } else {
    console.log(`Total users in Auth: ${users.users.length}`)
    const match = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (match) {
      console.log('User found in Auth:', match.id, match.email)
    } else {
      console.log('User NOT found in Auth list.')
      users.users.forEach(u => console.log('  ->', u.email, u.id))
    }
  }

  console.log('\n2. Searching database tables for the email or possible data')
  // We need to know what tables exist, but we can check common ones
  const tablesToCheck = ['users', 'profiles', 'customers', 'members']
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(10)
    if (error) {
      if (error.code !== '42P01') { // ignore relation does not exist
         console.log(`Table ${table} error:`, error.message)
      }
    } else {
      console.log(`Table ${table} exists. Rows: ${data.length}`)
      // Let's do a broader search inside this table if it exists
      const { data: searchData, error: searchErr } = await supabase
        .from(table)
        .select('*')
        .or(`email.ilike.%${email}%, email.ilike.%borghelix%`)
      if (!searchErr && searchData && searchData.length > 0) {
         console.log(`  MATCHES IN ${table}:`, JSON.stringify(searchData, null, 2))
      }
    }
  }

  // Also query to get all public tables using postgrest or just raw sql via rpc if possible
}

run()
