import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mcabsjuamjgkvfljkfit.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pYpJ5oKR-VFmy0O-meSmmQ_AZF9F0Aa";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSub() {
  const { data, error } = await supabase
    .from('subscription_cache')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching subscription cache', error);
  } else {
    console.log('Subscription Cache (limit 10):', JSON.stringify(data));
  }
}

checkSub();
