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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSimpleSignup() {
  console.log('--- Testing Simple Signup ---')
  const email = `test_simple_${Date.now()}@gmail.com`
  const password = 'TestPassword123!'

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    console.error('Signup Error:', error)
  } else {
    console.log('Signup Success!', data.user?.id)
  }
}

testSimpleSignup()
