# Dynamic Weekly Meal Planning System - Implementation Summary

## Overview
Implemented a comprehensive dynamic meal planning system as specified, with the following key improvements:

### ✅ Completed Features

#### 1. **Dynamic Meals Per Day (Flexible Architecture)**
- **Database Schema**: Added `meals_per_day` column to `user_tracker_settings` table
- **User Settings**: Users can now choose 3-6 meals per day during onboarding or later
- **Flexible Allocation**: Meal calorie allocation adapts based on selected meals per day:
  - **3 meals**: 30% breakfast, 40% lunch, 30% dinner
  - **4 meals**: 25% breakfast, 35% lunch, 10% snack, 30% dinner
  - **5 meals**: 25% breakfast, 10% snack, 30% lunch, 10% snack, 25% dinner (standard)
  - **6 meals**: 20% breakfast, 8% snack, 25% lunch, 10% snack, 22% dinner, 15% snack

#### 2. **Strict Per-Meal Validation (±50 kcal tolerance)**
- Each meal must be within ±50 kcal of its allocated calories
- Each meal must contain minimum protein: `dailyProtein / mealsPerDay`
- Daily totals must be within ±50 kcal of target

#### 3. **Intelligent Retry Logic (Up to 3 Attempts)**
- **Attempt 1**: Initial generation with detailed prompt
- **Attempt 2-3**: If validation fails, AI receives detailed error feedback and generates corrections
- AI is instructed to:
  - Increase portion sizes if calorie targets not met
  - Ensure protein minimums are met
  - Adjust meal composition to hit exact targets

#### 4. **Enhanced OpenAI Prompt System**
- Dynamic prompt generation based on:
  - User's calorie and macro targets
  - Number of meals per day
  - Per-meal calorie allocation
  - Minimum protein requirements
- Example calculations provided for AI reference
- Clear format specifications for JSON response

#### 5. **Comprehensive Error Reporting**
- Detailed validation errors explain exactly what failed
- Per-meal validation shows:
  - Calorie deviations with exact amounts
  - Protein shortfalls
  - Day-by-day breakdown
- Users receive actionable feedback if generation fails

### 📁 Files Modified

#### Backend (Supabase Edge Function)
1. **`supabase/functions/generate-meal-plan/index.ts`** - Major refactor
   - Dynamic meal allocation calculation
   - New validation functions (`validateMealPerformance`)
   - Retry loop with correction prompts (lines 360-495)
   - Enhanced system and user prompts
   - Detailed error handling and logging

#### Database Schema
2. **`supabase/migrations/20240409_add_meals_per_day.sql`** - New migration
   - Adds `meals_per_day` INT NOT NULL DEFAULT 5 to `user_tracker_settings`

#### TypeScript Definitions
3. **`src/integrations/supabase/types.ts`** - Updated
   - Added `meals_per_day: number` to user_tracker_settings types

#### Hooks & Context
4. **`src/hooks/useTrackerSettings.ts`** - Updated
   - Added `mealsPerDay` to `TrackerSettings` interface
   - Updated `parseDbSettings` to read `meals_per_day`
   - Updated `saveToDatabase` to persist `meals_per_day`

5. **`src/contexts/MealPlanContext.tsx`** - Updated
   - `generateMealPlan` now accepts `mealsPerDay` parameter
   - Passes `mealsPerDay` to edge function call

#### UI Components
6. **`src/components/MacroTracker.tsx`** - Enhanced
   - Added `mealsPerDay` state variable
   - New onboarding step: "Mahlzeiten pro Tag" (Meals per Day)
   - Visual selector with 3/4/5/6 options
   - Updated profile initialization and save logic
   - Added `mealsPerDay` to all `saveTrackerSettings` calls

7. **`src/pages/MealPlansPage.tsx`** - Updated
   - Reads `mealsPerDay` from tracker settings
   - Passes it to `globalGenerateMealPlan` function

### 🔄 Data Flow

```
User onboarding
  ↓
Sets: age, weight, goal, calories, macros, MEALS_PER_DAY
  ↓
MacroTracker saves via saveTrackerSettings()
  ↓
Stored in user_tracker_settings table
  ↓
MealPlansPage reads settings (including mealsPerDay)
  ↓
generateMealPlan() called with mealsPerDay parameter
  ↓
Supabase Edge Function receives mealsPerDay
  ↓
Dynamic meal allocation calculation
  ↓
OpenAI generates N meals (3-6) with strict requirements
  ↓
Validation loop (up to 3 attempts):
  - Structure check ✓
  - Per-meal calories ±50 ✓
  - Per-meal protein minimum ✓
  - Daily totals ±50 ✓
  ↓
Scaling to exact calorie target
  ↓
Success response to frontend
```

### 🎯 Key Validation Steps

1. **Structure Validation**
   - Array has 7 days
   - Each day has exactly N meals (where N = mealsPerDay)
   - All meals have required fields

2. **Per-Meal Validation** (NEW)
   ```
   - Calories: |meal.kcal - allocated.kcal| ≤ 50
   - Protein: meal.protein ≥ (dailyProtein / mealsPerDay)
   ```

3. **Daily Totals Validation**
   - Sum of all meals ≈ daily calorie target (±50 kcal)
   - Total protein ≥ daily protein target

4. **Intelligent Scaling**
   - If totals don't match, portions scaled proportionally
   - Ingredients amount scaled accordingly

### 🚀 Retry Mechanism

**Attempt 1:** Initial generation
```
User prompt: "Create a weekly plan for N meals per day with X kcal total"
```

**Attempt 2-3:** Correction generation (if validation fails)
```
User prompt: "{initial prompt}

ERRORS FROM ATTEMPT N:
- Day 1 Meal 1: Protein 20g is below minimum 30g
- Day 1 Meal 2: Calories 420 deviate by 70kcal

CORRECT THESE:
- Increase portion sizes...
```

### 📊 Deployment Checklist

Before production, you need to:

1. **Run the migration:**
   ```bash
   supabase db push
   ```
   This adds the `meals_per_day` column to `user_tracker_settings` with default value 5.

2. **Regenerate types:**
   ```bash
   supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```

3. **Test the flow:**
   - Complete onboarding (should see new "Mahlzeiten pro Tag" step)
   - Select number of meals per day
   - Generate a meal plan
   - Verify the response has the correct number of meals
   - Verify calorie allocation matches your selection

### 🧪 Testing Scenarios

**Scenario 1: 3 Meals Per Day**
- Expected allocation: 30%-40%-30%
- Should see only Breakfast, Lunch, Dinner meals

**Scenario 2: 5 Meals Per Day (Default)**
- Expected allocation: 25%-10%-30%-10%-25%
- Should see Breakfast, Snack, Lunch, Snack, Dinner

**Scenario 3: 6 Meals Per Day**
- Expected allocation: 20%-8%-25%-10%-22%-15%
- Should see maximum granularity with 6 meals

**Scenario 4: Retry on Failure**
- Generate plan with very strict settings
- If first attempt fails validation, watch console logs
- Should see "Attempt 2/3" message in logs
- AI should auto-correct protein/calorie issues

### 📝 Notes for Maintenance

1. **Per-Meal Validation**: The 50 kcal tolerance is strict. If AI struggles, increase to 75-100 kcal in `validateMealPerformance` function.

2. **Retry Count**: Currently set to 3 attempts. Can be increased in edge function variable `maxRetries`.

3. **Temperature**: OpenAI temperature is 0.3 (very consistent). If responses are too rigid, increase to 0.4-0.5.

4. **Meal Allocation**: Can be fine-tuned in `generateMealAllocation` function in edge function.

5. **Database Backward Compatibility**: New users get `meals_per_day = 5` by default. Existing users get filled with 5 if they haven't set it.

### 🔍 Logging

All major steps are logged with `[GENERATE-MEAL-PLAN]` prefix:
- `Attempt X/3`
- Structure validation results
- Per-meal validation details
- Calorie scaling information
- Final success summary

Check browser console or Supabase edge function logs to debug issues.

### ✨ Future Enhancements

Potential improvements:
1. Allow users to edit meals_per_day directly from Profile page
2. Add preset templates (e.g., "Intermittent Fasting", "6 Small Meals")
3. Cache meal allocation patterns
4. Add A/B testing for different allocation strategies
5. Machine learning to learn user preferences over time
