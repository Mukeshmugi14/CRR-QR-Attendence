-- setup.sql
-- Consolidated Supabase SQL Script to create schema, rules, security, functions, and seed 27 club members.
-- Paste this script directly in your Supabase SQL Editor and click 'Run'.

-- Set Timezone to Asia/Kolkata
SET timezone = 'Asia/Kolkata';

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: club_members
CREATE TABLE IF NOT EXISTS public.club_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    member_qr_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    qr_status TEXT DEFAULT 'active' CHECK (qr_status IN ('active', 'revoked')),
    qr_created_at TIMESTAMPTZ DEFAULT now(),
    qr_revoked_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('president', 'sergeant')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to automatically create admin_users profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_users (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'sergeant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_auth_users_after_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- Table: events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    attendance_cutoff_time TIMESTAMPTZ,
    event_qr_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: event_scoring_rules
CREATE TABLE IF NOT EXISTS public.event_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    rule_type TEXT CHECK (rule_type IN ('early', 'on_time', 'late')),
    min_minutes INTEGER NOT NULL,
    max_minutes INTEGER,
    score INTEGER NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    score INTEGER NOT NULL,
    timing_category TEXT,
    minutes_from_start INTEGER NOT NULL,
    attendance_method TEXT NOT NULL CHECK (attendance_method IN ('id_card_scan', 'self_checkin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_event_member UNIQUE (event_id, member_id)
);

-- Table: attendance_audit_log
CREATE TABLE IF NOT EXISTS public.attendance_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES public.attendance(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
    scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    attendance_method TEXT NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_club_members_code ON public.club_members(member_code);
CREATE INDEX IF NOT EXISTS idx_club_members_qr_token ON public.club_members(member_qr_token);
CREATE INDEX IF NOT EXISTS idx_club_members_position ON public.club_members(position);
CREATE INDEX IF NOT EXISTS idx_club_members_is_active ON public.club_members(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_end ON public.events(end_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_qr_token ON public.events(event_qr_token);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_scanned ON public.attendance(scanned_at);
CREATE INDEX IF NOT EXISTS idx_attendance_method ON public.attendance(attendance_method);

-- Enable RLS on all tables
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_log ENABLE ROW LEVEL SECURITY;

-- Security Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_president()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = 'president'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_sergeant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = 'sergeant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for Tables
CREATE POLICY "Admins can view and manage roles" ON public.admin_users FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage club members" ON public.club_members FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view scoring rules" ON public.event_scoring_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage scoring rules" ON public.event_scoring_rules FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL USING (public.is_admin());
CREATE POLICY "Public can insert attendance (for self check-in)" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage audit logs" ON public.attendance_audit_log FOR ALL USING (public.is_admin());


-- Business Logic Database Functions

-- 1. generate_default_scoring_rules()
CREATE OR REPLACE FUNCTION public.generate_default_scoring_rules(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.event_scoring_rules WHERE event_id = p_event_id;
  INSERT INTO public.event_scoring_rules (event_id, rule_type, min_minutes, max_minutes, score, label)
  VALUES 
    (p_event_id, 'early', -9999, -21, 130, '21+ min early'),
    (p_event_id, 'early', -20, -11, 115, '11-20 min early'),
    (p_event_id, 'early', -10, -5, 110, '5-10 min early'),
    (p_event_id, 'on_time', -4, 5, 100, 'On Time (0-5 min)'),
    (p_event_id, 'late', 6, 10, 95, '6-10 min late'),
    (p_event_id, 'late', 11, 15, 90, '11-15 min late'),
    (p_event_id, 'late', 16, 25, 80, '16-25 min late'),
    (p_event_id, 'late', 26, 30, 60, '26-30 min late'),
    (p_event_id, 'late', 31, 45, 40, '31-45 min late'),
    (p_event_id, 'late', 46, 58, 10, '46-58 min late'),
    (p_event_id, 'late', 59, 9999, 0, '59+ min late');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate default scoring rules for new events
CREATE OR REPLACE FUNCTION public.tr_events_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.generate_default_scoring_rules(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_events_after_insert_trigger
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_events_after_insert();


-- 2. calculate_attendance_score()
CREATE OR REPLACE FUNCTION public.calculate_attendance_score(p_event_id UUID, p_scanned_at TIMESTAMPTZ)
RETURNS TABLE (
  score INTEGER,
  label TEXT,
  rule_type TEXT,
  minutes_from_start INTEGER
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_minutes_from_start INTEGER;
  v_score INTEGER;
  v_label TEXT;
  v_rule_type TEXT;
BEGIN
  SELECT start_time INTO v_start_time FROM public.events WHERE id = p_event_id;
  IF v_start_time IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  v_minutes_from_start := ROUND(EXTRACT(EPOCH FROM (p_scanned_at - v_start_time)) / 60)::INTEGER;
  SELECT esr.score, esr.label, esr.rule_type INTO v_score, v_label, v_rule_type
  FROM public.event_scoring_rules esr
  WHERE esr.event_id = p_event_id
    AND v_minutes_from_start >= esr.min_minutes
    AND v_minutes_from_start <= COALESCE(esr.max_minutes, 99999)
  ORDER BY esr.score DESC
  LIMIT 1;
  IF v_score IS NULL THEN
    v_score := 0;
    v_label := 'Late / No Score';
    v_rule_type := 'late';
  END IF;
  RETURN QUERY SELECT v_score, v_label, v_rule_type, v_minutes_from_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. get_current_active_event()
CREATE OR REPLACE FUNCTION public.get_current_active_event(p_now TIMESTAMPTZ)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  event_date DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  attendance_cutoff_time TIMESTAMPTZ,
  event_qr_token UUID,
  status TEXT,
  present_count BIGINT,
  total_members BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id, e.name, e.description, e.event_date, e.start_time, e.end_time, e.attendance_cutoff_time, e.event_qr_token, e.status,
    (SELECT COUNT(*) FROM public.attendance a WHERE a.event_id = e.id) as present_count,
    (SELECT COUNT(*) FROM public.club_members m WHERE m.is_active = true) as total_members
  FROM public.events e
  WHERE 
    e.status IN ('active', 'scheduled')
    AND p_now >= (e.start_time - INTERVAL '2 hours')
    AND p_now <= (COALESCE(e.attendance_cutoff_time, e.end_time) + INTERVAL '1 hour')
  ORDER BY 
    CASE WHEN e.status = 'active' THEN 1 ELSE 2 END,
    e.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. record_id_card_attendance()
CREATE OR REPLACE FUNCTION public.record_id_card_attendance(
  p_member_qr_token UUID,
  p_scanned_by UUID,
  p_now TIMESTAMPTZ,
  p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  member_name TEXT,
  member_position TEXT,
  event_name TEXT,
  scan_time TIMESTAMPTZ,
  score INTEGER,
  timing_category TEXT,
  minutes_from_start INTEGER,
  already_exists BOOLEAN
) AS $$
DECLARE
  v_member_id UUID;
  v_member_name TEXT;
  v_member_position TEXT;
  v_qr_status TEXT;
  v_is_active BOOLEAN;
  v_event_id UUID;
  v_event_name TEXT;
  v_cutoff TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_attendance_id UUID;
  v_timing_cat TEXT;
  v_pts INTEGER;
  v_m_from_start INTEGER;
  v_active_event_count INTEGER;
BEGIN
  SELECT cm.id, cm.full_name, cm.position, cm.qr_status, cm.is_active
  INTO v_member_id, v_member_name, v_member_position, v_qr_status, v_is_active
  FROM public.club_members cm
  WHERE cm.member_qr_token = p_member_qr_token;

  IF v_member_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid member QR code. Member not found.'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF v_qr_status = 'revoked' THEN
    RETURN QUERY SELECT false, 'This QR code has been revoked.'::TEXT, v_member_name, v_member_position, NULL::TEXT, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF NOT v_is_active THEN
    RETURN QUERY SELECT false, 'This member is currently inactive.'::TEXT, v_member_name, v_member_position, NULL::TEXT, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF p_event_id IS NOT NULL THEN
    v_event_id := p_event_id;
    v_active_event_count := 1;
  ELSE
    SELECT COUNT(*), MAX(e.id) INTO v_active_event_count, v_event_id FROM public.events e
    WHERE e.status IN ('active', 'scheduled')
      AND p_now >= (e.start_time - INTERVAL '2 hours')
      AND p_now <= (COALESCE(e.attendance_cutoff_time, e.end_time) + INTERVAL '1 hour');
  END IF;

  IF v_active_event_count = 0 THEN
    RETURN QUERY SELECT false, 'NO ACTIVE EVENT'::TEXT, v_member_name, v_member_position, NULL::TEXT, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  ELSIF v_active_event_count > 1 THEN
    RETURN QUERY SELECT false, 'MULTIPLE ACTIVE EVENTS'::TEXT, v_member_name, v_member_position, NULL::TEXT, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  SELECT e.name, e.attendance_cutoff_time, e.end_time INTO v_event_name, v_cutoff, v_end FROM public.events e WHERE e.id = v_event_id;

  IF v_cutoff IS NOT NULL AND p_now > v_cutoff THEN
    RETURN QUERY SELECT false, 'Attendance window has closed for this event.'::TEXT, v_member_name, v_member_position, v_event_name, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.attendance WHERE event_id = v_event_id AND member_id = v_member_id) THEN
    SELECT a.scanned_at, a.score, a.timing_category, a.minutes_from_start INTO scan_time, v_pts, v_timing_cat, v_m_from_start
    FROM public.attendance a WHERE a.event_id = v_event_id AND a.member_id = v_member_id;
    RETURN QUERY SELECT true, 'ALREADY RECORDED'::TEXT, v_member_name, v_member_position, v_event_name, scan_time, v_pts, v_timing_cat, v_m_from_start, true;
    RETURN;
  END IF;

  SELECT cas.score, cas.label, cas.minutes_from_start INTO v_pts, v_timing_cat, v_m_from_start
  FROM public.calculate_attendance_score(v_event_id, p_now) cas;

  INSERT INTO public.attendance (event_id, member_id, scanned_at, score, timing_category, minutes_from_start, attendance_method)
  VALUES (v_event_id, v_member_id, p_now, v_pts, v_timing_cat, v_m_from_start, 'id_card_scan') RETURNING id INTO v_attendance_id;

  INSERT INTO public.attendance_audit_log (attendance_id, event_id, member_id, scanned_by, attendance_method, scanned_at)
  VALUES (v_attendance_id, v_event_id, v_member_id, p_scanned_by, 'id_card_scan', p_now);

  UPDATE public.events SET status = 'active', updated_at = now() WHERE id = v_event_id AND status = 'scheduled';
  RETURN QUERY SELECT true, 'SUCCESS'::TEXT, v_member_name, v_member_position, v_event_name, p_now, v_pts, v_timing_cat, v_m_from_start, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. record_self_checkin()
CREATE OR REPLACE FUNCTION public.record_self_checkin(
  p_event_qr_token UUID,
  p_full_name TEXT,
  p_position TEXT,
  p_now TIMESTAMPTZ
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  member_name TEXT,
  member_position TEXT,
  event_name TEXT,
  scan_time TIMESTAMPTZ,
  score INTEGER,
  timing_category TEXT,
  minutes_from_start INTEGER,
  already_exists BOOLEAN
) AS $$
DECLARE
  v_member_id UUID;
  v_member_name TEXT;
  v_member_position TEXT;
  v_is_active BOOLEAN;
  v_event_id UUID;
  v_event_name TEXT;
  v_event_status TEXT;
  v_cutoff TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_attendance_id UUID;
  v_timing_cat TEXT;
  v_pts INTEGER;
  v_m_from_start INTEGER;
BEGIN
  SELECT e.id, e.name, e.status, e.attendance_cutoff_time, e.end_time INTO v_event_id, v_event_name, v_event_status, v_cutoff, v_end
  FROM public.events e WHERE e.event_qr_token = p_event_qr_token;

  IF v_event_id IS NULL THEN
    RETURN QUERY SELECT false, 'Attendance link is no longer valid.'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF v_event_status = 'cancelled' THEN
    RETURN QUERY SELECT false, 'Attendance is unavailable for this event.'::TEXT, v_event_name, NULL::TEXT, v_event_name, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF v_event_status = 'completed' THEN
    RETURN QUERY SELECT false, 'Attendance is currently unavailable.'::TEXT, v_event_name, NULL::TEXT, v_event_name, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF v_cutoff IS NOT NULL AND p_now > v_cutoff THEN
    RETURN QUERY SELECT false, 'Attendance is currently unavailable.'::TEXT, v_event_name, NULL::TEXT, v_event_name, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  SELECT cm.id, cm.full_name, cm.position, cm.is_active INTO v_member_id, v_member_name, v_member_position, v_is_active
  FROM public.club_members cm
  WHERE LOWER(TRIM(cm.full_name)) = LOWER(TRIM(p_full_name))
    AND LOWER(TRIM(cm.position)) = LOWER(TRIM(p_position));

  IF v_member_id IS NULL THEN
    RETURN QUERY SELECT false, 'Member details not found. Please check your name and club position.'::TEXT, NULL::TEXT, NULL::TEXT, v_event_name, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF NOT v_is_active THEN
    RETURN QUERY SELECT false, 'This member is currently inactive.'::TEXT, v_member_name, v_member_position, v_event_name, NULL::TIMESTAMPTZ, 0, NULL::TEXT, 0, false;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.attendance WHERE event_id = v_event_id AND member_id = v_member_id) THEN
    SELECT a.scanned_at, a.score, a.timing_category, a.minutes_from_start INTO scan_time, v_pts, v_timing_cat, v_m_from_start
    FROM public.attendance a WHERE a.event_id = v_event_id AND a.member_id = v_member_id;
    RETURN QUERY SELECT true, 'ALREADY RECORDED'::TEXT, v_member_name, v_member_position, v_event_name, scan_time, v_pts, v_timing_cat, v_m_from_start, true;
    RETURN;
  END IF;

  SELECT cas.score, cas.label, cas.minutes_from_start INTO v_pts, v_timing_cat, v_m_from_start
  FROM public.calculate_attendance_score(v_event_id, p_now) cas;

  INSERT INTO public.attendance (event_id, member_id, scanned_at, score, timing_category, minutes_from_start, attendance_method)
  VALUES (v_event_id, v_member_id, p_now, v_pts, v_timing_cat, v_m_from_start, 'self_checkin') RETURNING id INTO v_attendance_id;

  INSERT INTO public.attendance_audit_log (attendance_id, event_id, member_id, scanned_by, attendance_method, scanned_at)
  VALUES (v_attendance_id, v_event_id, v_member_id, NULL, 'self_checkin', p_now);

  UPDATE public.events SET status = 'active', updated_at = now() WHERE id = v_event_id AND status = 'scheduled';
  RETURN QUERY SELECT true, 'SUCCESS'::TEXT, v_member_name, v_member_position, v_event_name, p_now, v_pts, v_timing_cat, v_m_from_start, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. revoke_member_qr()
CREATE OR REPLACE FUNCTION public.revoke_member_qr(p_member_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.club_members SET qr_status = 'revoked', qr_revoked_at = now(), updated_at = now() WHERE id = p_member_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. reissue_member_qr()
CREATE OR REPLACE FUNCTION public.reissue_member_qr(p_member_id UUID)
RETURNS UUID AS $$
DECLARE v_new_token UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  v_new_token := gen_random_uuid();
  UPDATE public.club_members SET qr_status = 'active', qr_created_at = now(), qr_revoked_at = NULL, member_qr_token = v_new_token, updated_at = now() WHERE id = p_member_id;
  RETURN v_new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Leaderboards Functions

-- 8. get_event_leaderboard()
CREATE OR REPLACE FUNCTION public.get_event_leaderboard(p_event_id UUID)
RETURNS TABLE (
  rank BIGINT,
  member_id UUID,
  full_name TEXT,
  "position" TEXT,
  member_code TEXT,
  scanned_at TIMESTAMPTZ,
  attendance_method TEXT,
  timing_category TEXT,
  minutes_from_start INTEGER,
  score INTEGER,
  scanned_by_name TEXT
) AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY a.score DESC, a.scanned_at ASC) as rank,
    m.id as member_id, m.full_name, m.position, m.member_code, a.scanned_at, a.attendance_method, a.timing_category, a.minutes_from_start, a.score,
    (SELECT cm.full_name FROM public.club_members cm WHERE cm.id = al.scanned_by) as scanned_by_name
  FROM public.attendance a
  JOIN public.club_members m ON a.member_id = m.id
  LEFT JOIN public.attendance_audit_log al ON a.id = al.attendance_id
  WHERE a.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. get_monthly_leaderboard()
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard(p_month INTEGER, p_year INTEGER)
RETURNS TABLE (
  rank BIGINT,
  member_id UUID,
  full_name TEXT,
  "position" TEXT,
  member_code TEXT,
  events_attended BIGINT,
  total_points BIGINT,
  average_score NUMERIC,
  attendance_percentage NUMERIC
) AS $$
DECLARE v_total_events BIGINT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  SELECT COUNT(*) INTO v_total_events FROM public.events
  WHERE EXTRACT(MONTH FROM event_date) = p_month AND EXTRACT(YEAR FROM event_date) = p_year AND status IN ('active', 'completed');
  IF v_total_events = 0 THEN v_total_events := 1; END IF;
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.score), 0) DESC, COUNT(a.id) DESC, COALESCE(AVG(a.score), 0) DESC, m.full_name ASC) as rank,
    m.id as member_id, m.full_name, m.position, m.member_code, COUNT(a.id) as events_attended, COALESCE(SUM(a.score), 0)::BIGINT as total_points,
    ROUND(COALESCE(AVG(a.score), 0), 1)::NUMERIC as average_score,
    ROUND((COUNT(a.id)::NUMERIC / v_total_events::NUMERIC) * 100, 1)::NUMERIC as attendance_percentage
  FROM public.club_members m
  LEFT JOIN public.attendance a ON m.id = a.member_id AND a.event_id IN (
    SELECT id FROM public.events WHERE EXTRACT(MONTH FROM event_date) = p_month AND EXTRACT(YEAR FROM event_date) = p_year AND status IN ('active', 'completed')
  )
  WHERE m.is_active = true
  GROUP BY m.id, m.full_name, m.position, m.member_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. get_all_time_leaderboard()
CREATE OR REPLACE FUNCTION public.get_all_time_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  member_id UUID,
  full_name TEXT,
  "position" TEXT,
  member_code TEXT,
  events_attended BIGINT,
  total_points BIGINT,
  average_score NUMERIC,
  best_event_score INTEGER,
  attendance_percentage NUMERIC
) AS $$
DECLARE v_total_events BIGINT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  SELECT COUNT(*) INTO v_total_events FROM public.events WHERE status IN ('active', 'completed');
  IF v_total_events = 0 THEN v_total_events := 1; END IF;
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.score), 0) DESC, COUNT(a.id) DESC, COALESCE(AVG(a.score), 0) DESC, m.full_name ASC) as rank,
    m.id as member_id, m.full_name, m.position, m.member_code, COUNT(a.id) as events_attended, COALESCE(SUM(a.score), 0)::BIGINT as total_points,
    ROUND(COALESCE(AVG(a.score), 0), 1)::NUMERIC as average_score,
    COALESCE(MAX(a.score), 0)::INTEGER as best_event_score,
    ROUND((COUNT(a.id)::NUMERIC / v_total_events::NUMERIC) * 100, 1)::NUMERIC as attendance_percentage
  FROM public.club_members m
  LEFT JOIN public.attendance a ON m.id = a.member_id AND a.event_id IN (
    SELECT id FROM public.events WHERE status IN ('active', 'completed')
  )
  WHERE m.is_active = true
  GROUP BY m.id, m.full_name, m.position, m.member_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- SEED DATA: Insert 27 Active Rotaract Club Members from the Roster
-- =========================================================================

INSERT INTO public.club_members (member_code, full_name, position, is_active, qr_status) VALUES
('RC001', 'RTR.A.GOPINATH', 'PRESIDENT', true, 'active'),
('RC002', 'RTR.PRIYADHARSHINI K', 'SECRETARY', true, 'active'),
('RC003', 'RTR.SATHYAPRIYA B', 'IPP/CHIEF CLUB ADVISOR', true, 'active'),
('RC004', 'RTR.DHARSHINI RAJU', 'VICE PRESIDENT', true, 'active'),
('RC005', 'RTR.SWATHY', 'JOINT SECRETARY', true, 'active'),
('RC006', 'RTR.KAAVIYA PRIYA B', 'CHIEF SERGEANT AT ARMS', true, 'active'),
('RC007', 'RTR.MUKESH', 'DEPUTY SERGEANT AT ARMS', true, 'active'),
('RC008', 'RTR.PADMAPRIYA', 'ASSOCIATE SERGEANT AT ARMS', true, 'active'),
('RC009', 'RTR.LOGASREE B', 'TREASURER', true, 'active'),
('RC010', 'RTR.SRIVIDHYA', 'JOINT TREASURER', true, 'active'),
('RC011', 'RTR.KEERTHIVASAN V', 'FOUNDATION/MEMBERSHIP CHAIRPERSON', true, 'active'),
('RC012', 'RTR.SHOBANKUMAR S', 'AVENUE COORDINATOR', true, 'active'),
('RC013', 'RTR. VISHWA N', 'COMMUNITY SERVICE DIRECTOR', true, 'active'),
('RC014', 'RTR VIGNESH N', 'ASSOCIATE COMMUNITY DIRECTOR', true, 'active'),
('RC015', 'RTR.PRITHIVI RAJ', 'PROFESSIONAL SERVICE DIRECTOR', true, 'active'),
('RC016', 'RTR.GANESH', 'ASSOCIATE PROFESSIONAL SERVICE DIRECTOR', true, 'active'),
('RC017', 'RTR.AAKASH KUMAR', 'INTERNATIONAL SERVICE DIRECTOR', true, 'active'),
('RC018', 'RTR. HARI KRISHNAN', 'ASSOCIATE INTERNATIONAL SERVICE', true, 'active'),
('RC019', 'RTR.RITHIESH', 'CLUB SERVICE DIRECTOR', true, 'active'),
('RC020', 'RTR.DHATCHINAMOORTHY K', 'ASSOCIATE CLUB SERVICE DIRECTOR', true, 'active'),
('RC021', 'RTR.SRIGANESH', 'PRO', true, 'active'),
('RC022', 'RTR. SIVAKUMAR', 'ASSOCIATE PRO', true, 'active'),
('RC023', 'RTR.DILLI BABU', 'BLOOD DONATION COORDINATOR', true, 'active'),
('RC024', 'RTR.SATHYA G', 'EMPLOYMENT CELL CHAIRPERSON', true, 'active'),
('RC025', 'RTR.SHOBANKUMAR P', 'Editorial board head', true, 'active'),
('RC026', 'RTR. VIMAL T', 'Associate editorial board head', true, 'active'),
('RC027', 'RTR.SIDDHARTH GOPINATH', 'HEALTH AND SPORTS CHAIRPERSON', true, 'active')
ON CONFLICT (member_code) DO NOTHING;
