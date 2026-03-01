import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mcabsjuamjgkvfljkfit.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pYpJ5oKR-VFmy0O-meSmmQ_AZF9F0Aa";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSub() {
  // Find user first
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'yousef0089mohamed@gmail.com')
    .single();

  if (pError || !profiles) {
    console.error('User not found in profiles', pError);
    return;
  }

  const userId = profiles.id;
  console.log('User ID:', userId);

  const { data: sub, error: sError } = await supabase
    .from('subscription_cache')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (sError) {
    console.error('Error finding subscription', sError);
  } else {
    console.log('Subscription:', JSON.stringify(sub));
  }
}

checkSub();
