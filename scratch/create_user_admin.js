const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manual env reading to avoid dotenv dependency issues
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment variables missing.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDevUser() {
  console.log('--- Creating User devpedro001 ---')
  const email = 'devpedro001@gmail.com'
  const password = 'Pacoca69m0m@'
  const nome = 'devpedro001'

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { nome },
    email_confirm: true
  })

  if (error) {
    console.error('CRITICAL ERROR creating user:', error)
  } else {
    console.log('SUCCESS: User created successfully!')
    console.log('User ID:', data.user.id)
  }
}

createDevUser()
