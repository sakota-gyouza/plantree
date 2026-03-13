-- ============================================================
-- Plantree Database Schema
-- Supabaseダッシュボードの SQL Editor で実行してください
-- ============================================================

-- ============================================================
-- PROFILES (auth.usersの拡張)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- ============================================================
-- TRIPS
-- ============================================================
CREATE TABLE public.trips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prefecture_code INT NOT NULL,
  sub_region TEXT,
  date TEXT,
  days INT NOT NULL DEFAULT 1,
  day_infos JSONB DEFAULT '[]'::jsonb,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SPOTS (個別テーブルでリアルタイム同期に対応)
-- ============================================================
CREATE TABLE public.spots (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  icon TEXT NOT NULL DEFAULT 'other',
  time TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  lat FLOAT,
  lon FLOAT,
  color TEXT,
  "order" INT NOT NULL DEFAULT 0,
  day INT NOT NULL DEFAULT 1,
  no_pin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spots_trip_id ON public.spots(trip_id);
CREATE INDEX idx_spots_trip_day_order ON public.spots(trip_id, day, "order");

-- ============================================================
-- TRIP MEMBERS (プラン共有)
-- ============================================================
CREATE TABLE public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own friendships" ON public.friendships
  FOR SELECT USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "Users can create friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Addressee can update friendship status" ON public.friendships
  FOR UPDATE USING (auth.uid() = addressee_id);
CREATE POLICY "Either party can delete friendship" ON public.friendships
  FOR DELETE USING (auth.uid() IN (requester_id, addressee_id));

-- Trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can do anything with trips" ON public.trips
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Members can select shared trips" ON public.trips
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = trips.id AND user_id = auth.uid())
  );
CREATE POLICY "Editors can update shared trips" ON public.trips
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = trips.id AND user_id = auth.uid() AND role = 'editor')
  );

-- Spots
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can do anything with spots" ON public.spots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = spots.trip_id AND owner_id = auth.uid())
  );
CREATE POLICY "Members can select shared spots" ON public.spots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = spots.trip_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Editors can modify shared spots" ON public.spots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = spots.trip_id AND user_id = auth.uid() AND role = 'editor'
    )
  );

-- Trip members
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage trip members" ON public.trip_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = trip_members.trip_id AND owner_id = auth.uid())
  );
CREATE POLICY "Members can see fellow members" ON public.trip_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = trip_members.trip_id AND tm.user_id = auth.uid())
  );

-- ============================================================
-- REALTIME (リアルタイム同期の有効化)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;

-- ============================================================
-- TRIGGER: 新規ユーザー登録時にプロフィール自動作成
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at 自動更新
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_spots_updated_at
  BEFORE UPDATE ON public.spots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
