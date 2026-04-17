import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment variables missing.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnose() {
  console.log('--- Diagnosis Start ---')
  const email = 'devpedro001@gmail.com'

  // 1. Verificando se o usuário já existe na tabela de auth
  console.log(`Checking if user ${email} exists...`)
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Error listing users:', listError)
  } else {
    const existingUser = users.users.find(u => u.email === email)
    if (existingUser) {
      console.log('User ALREADY EXISTS with ID:', existingUser.id)
      console.log('User Metadata:', existingUser.user_metadata)
    } else {
      console.log('User does not exist.')
    }
  }

  // 2. Testando uma inserção manual (se não existir) ou logando
  console.log('--- Diagnosis End ---')
}

diagnose()
