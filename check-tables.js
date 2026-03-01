import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mcabsjuamjgkvfljkfit.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pYpJ5oKR-VFmy0O-meSmmQ_AZF9F0Aa";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkTables() {
  const { data: usage, error: uError } = await supabase
    .from('meal_plan_usage')
    .select('*')
    .limit(1);

  if (uError) {
    console.error('Error finding meal_plan_usage table', uError);
  } else {
    console.log('meal_plan_usage table exists');
  }

  const { data: plans, error: pError } = await supabase
    .from('weekly_meal_plans')
    .select('*')
    .limit(1);

  if (pError) {
    console.error('Error finding weekly_meal_plans table', pError);
  } else {
    console.log('weekly_meal_plans table exists');
  }
}

checkTables();
