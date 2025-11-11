-- ============================================================================
-- MAKE USER ADMIN
-- Run this in Supabase SQL Editor to make a user an admin
-- ============================================================================

-- Method 1: Make a user admin by EMAIL
-- Replace 'your-email@example.com' with the actual email address
UPDATE public.users
SET role = 'admin'
WHERE email = 'harsh.89299100@gmail.com';

-- Verify the update (check if it worked)
SELECT id, email, full_name, role, created_at
FROM public.users
WHERE email = 'harsh.89299100@gmail.com';

-- ============================================================================
-- Method 2: Make a user admin by USER ID (UUID)
-- Replace 'user-id-here' with the actual user UUID
-- You can find the user ID in the auth.users table or from the users table
-- ============================================================================

-- UPDATE public.users
-- SET role = 'admin'
-- WHERE id = '95b6ecaf-1b8f-43e6-a863-4d757c6cd50d';

-- Verify the update
-- SELECT id, email, full_name, role, created_at
-- FROM public.users
-- WHERE id = '95b6ecaf-1b8f-43e6-a863-4d757c6cd50d';

-- ============================================================================
-- Method 3: List all users and their roles (to find the user first)
-- ============================================================================

-- SELECT 
--     id,
--     email,
--     full_name,
--     role,
--     profile_completed,
--     email_verified,
--     created_at
-- FROM public.users
-- ORDER BY created_at DESC;

-- ============================================================================
-- Method 4: Force update by ID (if email update doesn't work)
-- ============================================================================

-- UPDATE public.users
-- SET role = 'admin'
-- WHERE id = '95b6ecaf-1b8f-43e6-a863-4d757c6cd50d'
-- RETURNING id, email, role;

-- ============================================================================
-- Available Roles:
-- - 'user' (default) - Regular user
-- - 'admin' - Full admin access
-- - 'moderator' - Limited admin access
-- ============================================================================

-- ============================================================================
-- To make a user a moderator instead:
-- ============================================================================

-- UPDATE public.users
-- SET role = 'moderator'
-- WHERE email = 'harsh.89299100@gmail.com';

-- ============================================================================
-- To remove admin rights (make user regular):
-- ============================================================================

-- UPDATE public.users
-- SET role = 'user'
-- WHERE email = 'harsh.89299100@gmail.com';

-- ============================================================================
-- TROUBLESHOOTING: If UPDATE doesn't work
-- ============================================================================

-- 1. Check if user exists:
-- SELECT * FROM public.users WHERE email = 'harsh.89299100@gmail.com';

-- 2. Check current role:
-- SELECT email, role FROM public.users WHERE email = 'harsh.89299100@gmail.com';

-- 3. Check if RLS is blocking (should be disabled, but verify):
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'users';

-- 4. Try updating by ID instead:
-- UPDATE public.users
-- SET role = 'admin'
-- WHERE id = '95b6ecaf-1b8f-43e6-a863-4d757c6cd50d';

-- 5. Verify the update worked:
-- SELECT id, email, role, updated_at 
-- FROM public.users 
-- WHERE email = 'harsh.89299100@gmail.com';
