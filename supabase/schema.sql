-- Supabase Schema for 1reply
-- Run this in the Supabase SQL Editor after creating your project

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- USER_SCENARIOS TABLE
-- User-created scenario pairs for sharing
-- ============================================
CREATE TABLE user_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  situation_a JSONB NOT NULL,
  situation_b JSONB NOT NULL,
  situation_c JSONB, -- Optional for trios/extreme mode
  play_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast share_code lookups
CREATE INDEX idx_user_scenarios_share_code ON user_scenarios(share_code);
CREATE INDEX idx_user_scenarios_author_id ON user_scenarios(author_id);

-- RLS for user_scenarios
ALTER TABLE user_scenarios ENABLE ROW LEVEL SECURITY;

-- Anyone can view scenarios (for playing via share link)
CREATE POLICY "Scenarios are viewable by everyone"
  ON user_scenarios FOR SELECT
  USING (true);

-- Only authenticated users can create scenarios
CREATE POLICY "Authenticated users can create scenarios"
  ON user_scenarios FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can only update their own scenarios
CREATE POLICY "Users can update their own scenarios"
  ON user_scenarios FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can only delete their own scenarios
CREATE POLICY "Users can delete their own scenarios"
  ON user_scenarios FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- USER_SCORES TABLE
-- Persistent scores for signed-in users
-- ============================================
CREATE TABLE user_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('classic', 'timer', 'daily', 'extreme', 'custom')),
  score INTEGER NOT NULL,
  rounds_survived INTEGER NOT NULL,
  scenario_id UUID REFERENCES user_scenarios(id) ON DELETE SET NULL, -- NULL for built-in scenarios
  played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for leaderboard queries
CREATE INDEX idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX idx_user_scores_mode_score ON user_scores(mode, score DESC);
CREATE INDEX idx_user_scores_played_at ON user_scores(played_at DESC);

-- RLS for user_scores
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

-- Users can view all scores (for leaderboards)
CREATE POLICY "Scores are viewable by everyone"
  ON user_scores FOR SELECT
  USING (true);

-- Users can only insert their own scores
CREATE POLICY "Users can insert their own scores"
  ON user_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own scores
CREATE POLICY "Users can delete their own scores"
  ON user_scores FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTION: Increment play count
-- ============================================
CREATE OR REPLACE FUNCTION increment_play_count(scenario_share_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_scenarios
  SET play_count = play_count + 1, updated_at = NOW()
  WHERE share_code = scenario_share_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
