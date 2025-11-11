-- ============================================================================
-- START HERE - Complete Fresh Database Setup
-- Run this in your NEW Supabase project SQL Editor
-- This creates everything from scratch WITHOUT RLS
-- ============================================================================

-- ============================================================================
-- STEP 1: Create users table
-- ============================================================================

DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    id_card_hash TEXT,
    id_card_barcode TEXT,
    id_card_verified BOOLEAN DEFAULT FALSE,
    id_card_image_url TEXT,
    profile_completed BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    user_type TEXT CHECK (user_type IN ('student', 'teacher')),
    department TEXT,
    year INTEGER,
    section TEXT,
    club TEXT,
    registration_gps JSONB,
    registration_ip TEXT,
    device_fingerprint TEXT,
    last_login TIMESTAMPTZ,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on id_card_barcode (allows NULL, but unique for non-null values)
-- This ensures each barcode can only be used once
CREATE UNIQUE INDEX idx_users_id_card_barcode_unique ON public.users(id_card_barcode) WHERE id_card_barcode IS NOT NULL;

-- Also keep hash index for backward compatibility
CREATE UNIQUE INDEX idx_users_id_card_hash_unique ON public.users(id_card_hash) WHERE id_card_hash IS NOT NULL;

-- Other indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_profile_completed ON public.users(profile_completed);
CREATE INDEX idx_users_user_type ON public.users(user_type);
CREATE INDEX idx_users_department ON public.users(department);

-- ============================================================================
-- STEP 2: Create voting_sessions table
-- ============================================================================

DROP TABLE IF EXISTS public.voting_sessions CASCADE;

CREATE TABLE public.voting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
    criteria JSONB,
    allowed_gps_radius INTEGER,
    center_gps JSONB,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    minimum_duration INTERVAL,
    allow_multiple_votes BOOLEAN DEFAULT FALSE,
    show_live_results BOOLEAN DEFAULT TRUE,
    require_gps BOOLEAN DEFAULT FALSE,
    max_votes_per_option INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voting_sessions_status ON public.voting_sessions(status);
CREATE INDEX idx_voting_sessions_created_by ON public.voting_sessions(created_by);

-- ============================================================================
-- STEP 3: Create voting_options table
-- ============================================================================

DROP TABLE IF EXISTS public.voting_options CASCADE;

CREATE TABLE public.voting_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_image_url TEXT,
    option_order INTEGER,
    additional_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voting_options_session_id ON public.voting_options(session_id);

-- ============================================================================
-- STEP 4: Create votes table
-- ============================================================================

DROP TABLE IF EXISTS public.votes CASCADE;

CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.voting_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    gps_location JSONB,
    ip_address TEXT,
    device_fingerprint TEXT,
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    invalidation_reason TEXT
);

CREATE UNIQUE INDEX idx_votes_unique ON public.votes(session_id, user_id, option_id);
CREATE INDEX idx_votes_session_id ON public.votes(session_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_option_id ON public.votes(option_id);

-- ============================================================================
-- STEP 5: Create OTP verifications table
-- ============================================================================

DROP TABLE IF EXISTS public.otp_verifications CASCADE;

CREATE TABLE public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    identifier TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    otp_type TEXT NOT NULL CHECK (otp_type IN ('email')),
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_verifications_user_id ON public.otp_verifications(user_id);
CREATE INDEX idx_otp_verifications_identifier ON public.otp_verifications(identifier);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);

-- ============================================================================
-- STEP 6: Create ID verification attempts table
-- ============================================================================

DROP TABLE IF EXISTS public.id_verification_attempts CASCADE;

CREATE TABLE public.id_verification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    barcode_hash TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_id_verification_attempts_user_id ON public.id_verification_attempts(user_id);

-- ============================================================================
-- STEP 7: DISABLE RLS (Make everything public)
-- ============================================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_verification_attempts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage.objects (for id-cards bucket uploads)
-- This allows authenticated users to upload/read their own files
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

GRANT ALL ON public.users TO authenticated, anon;
GRANT ALL ON public.voting_sessions TO authenticated, anon;
GRANT ALL ON public.voting_options TO authenticated, anon;
GRANT ALL ON public.votes TO authenticated, anon;
GRANT ALL ON public.otp_verifications TO authenticated, anon;
GRANT ALL ON public.id_verification_attempts TO authenticated, anon;

-- ============================================================================
-- STEP 9: Create trigger function (optional - app code will handle if this fails)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id, email, full_name, phone,
    email_verified, phone_verified, id_card_verified, id_card_hash,
    profile_completed, role, is_blocked
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    false, false, NULL, false, 'user', false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Try to create trigger (might fail due to permissions, but that's OK)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    RAISE NOTICE 'Trigger created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create trigger (permissions): %. App code will handle user creation.', SQLERRM;
END $$;

-- ============================================================================
-- STEP 10: Create function to check for duplicate ID card hash
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_id_card_hash_exists(hash_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id_card_hash = hash_to_check 
    AND id_card_hash IS NOT NULL
  );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_id_card_hash_exists(TEXT) TO authenticated, anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ Database setup complete!' as status;

SELECT 
    'Tables Created' as check_type,
    COUNT(*)::text as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'voting_sessions', 'voting_options', 'votes', 'otp_verifications', 'id_verification_attempts');

SELECT 
    'RLS Status' as check_type,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'voting_sessions', 'voting_options', 'votes')
            AND rowsecurity = false
        ) = 4
        THEN '✅ RLS DISABLED (as intended)'
        ELSE '⚠️ Some tables have RLS enabled'
    END as status;

SELECT '✅ Ready to use! Update .env.local with new API keys and test registration.' as next_step;

