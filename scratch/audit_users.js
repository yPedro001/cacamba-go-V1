const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = Object.fromEntries(
  envContent.split('\n').filter(line => line.includes('=')).map(line => {
    const [key, ...value] = line.split('=')
    return [key.trim(), value.join('=').trim()]
  })
)

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function auditUsers() {
  console.log('--- Auditing Users ---')
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Audit Error:', error)
  } else {
    console.log(`Found ${data.users.length} users.`)
    data.users.forEach(u => {
      console.log(`- ${u.email} (${u.id}) - Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}`)
    })
  }
}

auditUsers()
