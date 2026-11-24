-- ============================================================================
-- Task Force Bruno / Wildcat Welfare Portal — Pre-Defense Supabase Hardening
-- Run once in Supabase Dashboard -> SQL Editor (idempotent / safe to re-run)
-- ============================================================================

-- 1. Drop overly permissive public/anon RLS policies across backend-managed tables
DROP POLICY IF EXISTS "Enable full access for all applications" ON public.adoption_applications;
DROP POLICY IF EXISTS "Allow public insert access" ON public.animal_sightings;
DROP POLICY IF EXISTS "Allow public read access" ON public.animal_sightings;
DROP POLICY IF EXISTS "Allow public update access" ON public.animal_sightings;
DROP POLICY IF EXISTS "Allow universal insert access" ON public.campus_announcements;
DROP POLICY IF EXISTS "Allow universal read access" ON public.campus_announcements;
DROP POLICY IF EXISTS "Allow public insert on comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Allow public select on comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Allow public delete on likes" ON public.feed_likes;
DROP POLICY IF EXISTS "Allow public insert on likes" ON public.feed_likes;
DROP POLICY IF EXISTS "Allow public select on likes" ON public.feed_likes;
DROP POLICY IF EXISTS "Enable full access for all rows" ON public.inventory;
DROP POLICY IF EXISTS "Enable full access for all transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Enable full access for all medical rows" ON public.medical_records;
DROP POLICY IF EXISTS "Allow anonymous read access to pet galleries" ON public.pet_images;
DROP POLICY IF EXISTS "Allow anonymous read access to pets profiles" ON public.pets;
DROP POLICY IF EXISTS "Allow public insert access on pets" ON public.pets;
DROP POLICY IF EXISTS "Allow public update access on pets" ON public.pets;
DROP POLICY IF EXISTS "Allow public insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable full access for all vaccination rows" ON public.vaccination_logs;

-- Ensure RLS is enabled on every public table
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

-- Restrict direct PostgREST access strictly to backend service_role
-- (and allow authenticated users to read only their own profile row)
DROP POLICY IF EXISTS "Backend service role access" ON public.adoption_applications;
DROP POLICY IF EXISTS "Backend service role access" ON public.animal_sightings;
DROP POLICY IF EXISTS "Backend service role access" ON public.campus_announcements;
DROP POLICY IF EXISTS "Backend service role access" ON public.clinic_automation_logs;
DROP POLICY IF EXISTS "Backend service role access" ON public.feed_comments;
DROP POLICY IF EXISTS "Backend service role access" ON public.feed_likes;
DROP POLICY IF EXISTS "Backend service role access" ON public.inventory;
DROP POLICY IF EXISTS "Backend service role access" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Backend service role access" ON public.medical_records;
DROP POLICY IF EXISTS "Backend service role access" ON public.pet_images;
DROP POLICY IF EXISTS "Backend service role access" ON public.pets;
DROP POLICY IF EXISTS "Backend service role access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Backend service role access" ON public.vaccination_logs;

CREATE POLICY "Backend service role access" ON public.adoption_applications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.animal_sightings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.campus_announcements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.clinic_automation_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.feed_comments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.feed_likes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.inventory FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.inventory_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.medical_records FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.pet_images FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.pets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend service role access" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
CREATE POLICY "Backend service role access" ON public.vaccination_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Revoke public/anon/authenticated execute privileges on privileged RPC functions
REVOKE ALL ON FUNCTION public.record_inventory_transaction(bigint, text, integer, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_inventory_transaction(bigint, text, integer, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.run_daily_clinic_watchdog() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_daily_clinic_watchdog() TO service_role;

REVOKE ALL ON FUNCTION public.sync_daily_clinical_statuses() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_daily_clinical_statuses() TO service_role;

-- 3. Lock down Storage buckets (drop anonymous direct uploads; enforce 5 MB & image MIME types; keep public READ)
DROP POLICY IF EXISTS "Allow public uploads to announcements bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to petpictures bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to sightings bucket" ON storage.objects;

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id IN ('announcements', 'petpictures', 'sightings');

-- 4. Fix Manila timezone (UTC+8) and non-sticky cleared quarantine text in scheduled clinical functions
CREATE OR REPLACE FUNCTION public.run_daily_clinic_watchdog()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_today DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
    v_low_stock INTEGER := 0;
    v_expiring_soon INTEGER := 0;
    v_overdue_vax INTEGER := 0;
    v_urgent_sightings INTEGER := 0;
    v_pending_apps INTEGER := 0;
    v_metrics JSONB;
BEGIN
    SELECT count(*) INTO v_low_stock
    FROM public.inventory
    WHERE quantity <= coalesce(min_threshold, 10);

    SELECT count(*) INTO v_expiring_soon
    FROM public.inventory
    WHERE expiration_date IS NOT NULL
      AND expiration_date <= (v_today + INTERVAL '30 days')::date;

    SELECT count(*) INTO v_overdue_vax
    FROM public.pets
    WHERE archived_at IS NULL
      AND vaccination_status = 'Booster Overdue';

    SELECT count(*) INTO v_urgent_sightings
    FROM public.animal_sightings
    WHERE status <> 'Resolved'
      AND (is_emergency = true OR distinct_features ILIKE '%[URGENT EMERGENCY]%');

    SELECT
        (SELECT count(*) FROM public.adoption_applications WHERE application_status = 'Pending')
        + (SELECT count(*) FROM public.volunteer_applications WHERE status = 'Pending')
    INTO v_pending_apps;

    v_metrics := jsonb_build_object(
        'low_stock_items', v_low_stock,
        'expiring_supplies_30d', v_expiring_soon,
        'overdue_vaccines', v_overdue_vax,
        'urgent_sightings', v_urgent_sightings,
        'pending_applications', v_pending_apps,
        'checked_date_pht', v_today
    );

    INSERT INTO public.clinic_automation_logs (job_name, summary, metrics)
    VALUES (
        'tfb-daily-clinic-watchdog',
        format(
            'Daily check: %s low-stock, %s expiring soon, %s overdue boosters, %s urgent sightings, %s pending applications.',
            v_low_stock, v_expiring_soon, v_overdue_vax, v_urgent_sightings, v_pending_apps
        ),
        v_metrics
    );

    RETURN v_metrics;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_daily_clinical_statuses()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_today DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
    v_vax_updated INTEGER := 0;
    v_quarantine_cleared INTEGER := 0;
    v_result JSONB;
BEGIN
    WITH real_vacs AS (
        SELECT
            pet_id,
            lower(coalesce(vaccine_name, '')) AS vac_lower,
            CASE
                WHEN next_due_date IS NOT NULL THEN next_due_date >= v_today
                WHEN administered_date IS NOT NULL THEN (administered_date + INTERVAL '365 days')::date >= v_today
                ELSE FALSE
            END AS is_active
        FROM public.vaccination_logs
        WHERE trim(coalesce(vaccine_name, '')) <> ''
          AND lower(vaccine_name) NOT SIMILAR TO '%(deworm|anthelmintic|pyrantel|praziquantel|flea|tick|heartworm|vitamin|supplement|probiotic)%'
    ),
    computed AS (
        SELECT
            p.pet_id,
            CASE
                WHEN bool_or(rv.is_active AND rv.vac_lower LIKE '%rabies%') THEN 'Fully Vaccinated'
                WHEN bool_or(rv.is_active) THEN 'Core Only (No Anti-Rabies)'
                WHEN count(rv.pet_id) > 0 THEN 'Booster Overdue'
                ELSE 'Not Vaccinated'
            END AS new_status
        FROM public.pets p
        LEFT JOIN real_vacs rv ON rv.pet_id = p.pet_id
        WHERE p.archived_at IS NULL
        GROUP BY p.pet_id
    )
    UPDATE public.pets p
    SET vaccination_status = c.new_status
    FROM computed c
    WHERE p.pet_id = c.pet_id
      AND coalesce(p.vaccination_status, '') IS DISTINCT FROM c.new_status;

    GET DIAGNOSTICS v_vax_updated = ROW_COUNT;

    -- Clear expired 14-day RA 9482 quarantine text without leaving 'Quarantine'/'Observation' keywords behind
    UPDATE public.pets
    SET current_conditions = 'Cleared - Healthy (RA 9482 Completed)'
    WHERE archived_at IS NULL
      AND current_conditions ~* 'until\s+\d{4}-\d{2}-\d{2}'
      AND (regexp_match(current_conditions, 'until\s+(\d{4}-\d{2}-\d{2})', 'i'))[1]::date < v_today;

    GET DIAGNOSTICS v_quarantine_cleared = ROW_COUNT;

    -- Normalize any previously cleared rows that still carried the old 'Quarantine Observation Cleared' wording
    UPDATE public.pets
    SET current_conditions = 'Cleared - Healthy (RA 9482 Completed)'
    WHERE current_conditions = 'Quarantine Observation Cleared (RA 9482)';

    v_result := jsonb_build_object(
        'vaccinations_synced', v_vax_updated,
        'quarantines_cleared', v_quarantine_cleared,
        'synced_date', v_today
    );

    INSERT INTO public.clinic_automation_logs (job_name, summary, metrics)
    VALUES (
        'tfb-daily-clinical-sync',
        format('Synced %s vaccination status(es); cleared %s expired 14-day quarantine(s).', v_vax_updated, v_quarantine_cleared),
        v_result
    );

    RETURN v_result;
END;
$function$;
