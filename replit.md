# Oil Wellness Tracker

## Overview
A health/wellness application focused on tracking cooking oil consumption with features including daily logging, bottle tracking, barcode scanning, low-oil recipes, rewards system, challenges, and restaurant partnerships.

## Current State
The app is fully functional with:
- Daily oil logging with calorie and amount tracking
- Bottle management and barcode scanning
- Recipe suggestions (FitMeal)
- Points and rewards system
- Challenges and quizzes
- Restaurant partner listings with admin approval workflow
- User profiles with achievements/badges

## Recent Changes (December 2025)
- Added Profile page with rewards hub, achievements, and settings
- Implemented restaurant application system with submission form
- Created Admin dashboard for managing restaurant applications
- Added Restaurants page to view approved healthy restaurants
- Relocated rewards feature from Discover to Profile menu
- Updated navigation: Profile replaced Discover in bottom nav

## Project Architecture

### Frontend (React + Vite)
- `/src/pages/` - Main page components
  - `Index.tsx` - Home/Dashboard
  - `Tracker.tsx` - Oil logging and tracking
  - `FitMeal.tsx` - Recipe suggestions
  - `OilHub.tsx` - Store/products
  - `Discover.tsx` - Health info, quizzes, leaderboard
  - `Profile.tsx` - User profile, rewards, settings
  - `RestaurantApply.tsx` - Restaurant application form
  - `Restaurants.tsx` - Browse healthy restaurants
  - `Admin.tsx` - Admin dashboard for approvals
- `/src/components/` - Reusable UI components
- `/src/hooks/` - Custom React hooks (usePoints, useAchievements, etc.)
- `/src/integrations/supabase/` - Supabase client and types

### Database (Supabase PostgreSQL)
Main tables:
- `user_profiles` - User data with role field (user/admin/restaurant_owner)
- `daily_logs` - Oil consumption logs
- `bottles` - User's oil bottles
- `user_points` - Points balance
- `challenges`, `user_challenges` - Challenge system
- `achievements`, `user_achievements` - Badge/achievement system
- `rewards`, `user_rewards` - Rewards store
- `restaurant_applications` - Pending restaurant applications
- `restaurants` - Approved restaurant listings
- `reward_activity_log` - Points activity history

### Key Features
1. **Oil Tracking**: Log daily oil usage with calorie calculation
2. **Bottle Management**: Track oil bottles with barcode scanning
3. **Rewards System**: Earn points for activities, redeem in store
4. **Challenges**: Weekly/monthly health challenges
5. **Quizzes**: Health knowledge quizzes for points
6. **Restaurant Partners**: Apply and browse healthy restaurants

## User Preferences
- Mobile-first design approach
- Use of Shadcn UI components
- Tailwind CSS for styling
- Toast notifications for feedback
- Bottom navigation for main sections

## Database Migration
To add new restaurant features, run the migration:
```sql
-- Located at: supabase/migrations/20251202200000_restaurant_features.sql
```
After running migration, regenerate Supabase types.

## Environment Variables
Required Supabase credentials:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
