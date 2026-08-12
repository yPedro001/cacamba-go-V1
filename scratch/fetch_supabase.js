const SUPABASE_URL = 'https://rgxeownxdcdqqxisklzu.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneGVvd254ZGNkcXF4aXNrbHp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ5NTExMiwiZXhwIjoyMDkwMDcxMTEyfQ.Jw_-T3aw8DeIW_enDpnmc096qFcFtxYyaFEXoBIo_lc'
const EMAIL = 'Borghelixcacambas@gmail.com'

async function run() {
  const headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }

  console.log('--- 1. Checking auth.users via Admin API ---')
  const authUrl = `${SUPABASE_URL}/auth/v1/admin/users`
  const resUsers = await fetch(authUrl, { headers })
  if (!resUsers.ok) {
    console.error('Failed fetching users:', await resUsers.text())
  } else {
    const data = await resUsers.json()
    console.log(`Total users in auth: ${data.users?.length || data.length || 0}`)
    const users = data.users || data
    const match = users.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase())
    if (match) {
      console.log('FOUND USER IN AUTH:', match.id, match.email)
    } else {
      console.log('User not found in Auth! Users found:')
      users.forEach(u => console.log(' ->', u.email, u.id))
    }
  }

  console.log('\n--- 2. Checking perfis table ---')
  const profilesUrl = `${SUPABASE_URL}/rest/v1/perfis?select=*`
  const resProfiles = await fetch(profilesUrl, { headers })
  if (!resProfiles.ok) {
    console.error('Failed fetching perfis:', await resProfiles.text())
  } else {
    const perfis = await resProfiles.json()
    console.log(`Total perfis: ${perfis.length}`)
    // Look into app_state or just list them all
    for (const p of perfis) {
      console.log(`- Perfil ID: ${p.id}, Nome: ${p.nome}`)
      if (p.app_state?.perfil?.email) {
        console.log(`    app_state.perfil.email: ${p.app_state.perfil.email}`)
      }
      
      const emailMatches = JSON.stringify(p).toLowerCase().includes(EMAIL.toLowerCase())
      if (emailMatches) {
        console.log('    >> MATCHED EMAIL IN DATA <<')
      }
    }
  }
}

run()
