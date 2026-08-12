const SUPABASE_URL = 'https://rgxeownxdcdqqxisklzu.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneGVvd254ZGNkcXF4aXNrbHp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ5NTExMiwiZXhwIjoyMDkwMDcxMTEyfQ.Jw_-T3aw8DeIW_enDpnmc096qFcFtxYyaFEXoBIo_lc'

const EMAIL = 'Borghelixcacambas@gmail.com'
const PASSWORD = '@senha123'

async function createUser() {
  console.log(`Creating user ${EMAIL}...`);
  try {
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true
      })
    });

    if (!authRes.ok) {
      const err = await authRes.text();
      console.error('Failed to create auth user:', err);
      return;
    }

    const userData = await authRes.json();
    console.log('User created successfully in Auth!', userData.id);
    const userId = userData.id;

    // Insert into perfis
    console.log(`Inserting profile for UUID ${userId}...`);
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/perfis`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId,
        nome: 'Borghelix Cacambas',
        email: EMAIL,
        app_state: {}
      })
    });

    if (!profileRes.ok) {
      const err = await profileRes.text();
      console.error('Failed to insert profile:', err);
      return;
    }

    const profileData = await profileRes.json();
    console.log('Profile created successfully!', profileData[0]?.id || profileData.id);

  } catch (err) {
    console.error('Execution error:', err);
  }
}

createUser();
