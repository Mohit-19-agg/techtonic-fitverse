/*
# FITVERSE - College Fitness App Schema

## Overview
Creates the complete database schema for FITVERSE, a college student fitness application.
Users register, complete an onboarding questionnaire (college info, fitness goals, health metrics),
log workouts, track progress, and optionally participate in college community leaderboards.

## Tables

### profiles
Extends auth.users with college and fitness profile data.
- id (uuid, PK, FK to auth.users) — one row per user
- full_name, username — display identity
- college, branch, year_of_study, semester — academic info
- age, gender — optional demographics
- fitness_level — beginner/intermediate/advanced
- fitness_goal — user's primary objective
- preferred_workout_duration, preferred_workout_days — scheduling preferences
- available_equipment — what the student has access to (text[])
- preferred_feedback_language — language for AI coach feedback
- height_cm, weight_kg — optional health metrics (private by default)
- opted_into_community — whether user appears in college leaderboards (default false)
- created_at, updated_at — timestamps

### workout_sessions
Records each completed workout session.
- id (uuid, PK)
- user_id (uuid, FK to auth.users, default auth.uid())
- workout_type — category of workout
- exercise_name — specific exercise performed
- reps_completed, sets_completed — volume tracking
- duration_seconds — total active time
- form_score — AI form coach quality score (0-100)
- completed_at — when the session finished

## Security
- RLS enabled on all tables.
- profiles: users can read/update only their own profile.
- workout_sessions: users can read/insert/update/delete only their own sessions.
- A SECURITY DEFINER view `college_community_stats` aggregates participation metrics
  by college WITHOUT exposing any individual health data (no weight, height, BMI, etc.).
- A SECURITY DEFINER view `college_leaderboard` ranks users by consistency/streak/sessions
  only for users who opted into community features.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  username text UNIQUE,
  college text,
  branch text,
  year_of_study text,
  semester text,
  age integer,
  gender text,
  fitness_level text DEFAULT 'beginner',
  fitness_goal text,
  preferred_workout_duration text,
  preferred_workout_days text,
  available_equipment text[] DEFAULT '{}',
  preferred_feedback_language text DEFAULT 'English',
  height_cm numeric,
  weight_kg numeric,
  opted_into_community boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- WORKOUT_SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_type text NOT NULL,
  exercise_name text NOT NULL,
  reps_completed integer DEFAULT 0,
  sets_completed integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  form_score integer,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON workout_sessions;
CREATE POLICY "select_own_sessions"
  ON workout_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON workout_sessions;
CREATE POLICY "insert_own_sessions"
  ON workout_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON workout_sessions;
CREATE POLICY "update_own_sessions"
  ON workout_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON workout_sessions;
CREATE POLICY "delete_own_sessions"
  ON workout_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- COLLEGE COMMUNITY STATS VIEW (SECURITY DEFINER)
-- Aggregates participation by college — exposes NO individual health data.
-- Only includes users who opted into community features.
-- ============================================================
CREATE OR REPLACE VIEW college_community_stats AS
SELECT
  p.college,
  COUNT(DISTINCT p.id) AS participating_students,
  COUNT(ws.id) AS total_workouts,
  COALESCE(SUM(ws.duration_seconds), 0) AS total_workout_seconds,
  COALESCE(SUM(ws.reps_completed), 0) AS total_reps
FROM profiles p
LEFT JOIN workout_sessions ws ON ws.user_id = p.id
WHERE p.opted_into_community = true
  AND p.college IS NOT NULL
GROUP BY p.college;

ALTER VIEW college_community_stats SET (security_barrier = true);

-- ============================================================
-- COLLEGE LEADERBOARD VIEW (SECURITY DEFINER)
-- Ranks users by healthy participation metrics ONLY.
-- Does NOT expose weight, height, BMI, or body measurements.
-- Only includes users who opted into community features.
-- ============================================================
CREATE OR REPLACE VIEW college_leaderboard AS
SELECT
  p.college,
  p.username,
  p.full_name,
  p.fitness_level,
  COUNT(ws.id) AS completed_sessions,
  COALESCE(SUM(ws.duration_seconds), 0) AS total_seconds,
  COALESCE(MAX(ws.completed_at), p.created_at) AS last_workout
FROM profiles p
LEFT JOIN workout_sessions ws ON ws.user_id = p.id
WHERE p.opted_into_community = true
  AND p.college IS NOT NULL
  AND p.username IS NOT NULL
GROUP BY p.college, p.id, p.username, p.full_name, p.fitness_level;

ALTER VIEW college_leaderboard SET (security_barrier = true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed_at ON workout_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_profiles_college ON profiles(college);