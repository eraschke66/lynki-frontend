-- Add subscription_interval to user_profiles.
-- Tracks whether the user is on the monthly ($9.99/mo) or annual ($79/yr) plan.
-- Nullable so existing premium users (legacy annual) are unaffected.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS subscription_interval TEXT
    CHECK (subscription_interval IN ('monthly', 'annual'));
