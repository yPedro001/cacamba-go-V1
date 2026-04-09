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

async function testPublicSchema() {
  console.log('--- Testing Public Schema (clientes) ---')
  const { data, error } = await supabase.from('clientes').select('id').limit(1)

  if (error) {
    console.error('Database Error (Public):', error)
  } else {
    console.log('Public Schema access: SUCCESS!')
    console.log('Data:', data)
  }
}

testPublicSchema()
