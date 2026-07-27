-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION fn_create_staff_user(
  email text,
  password text,
  name text,
  role text,
  branch_id uuid
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Validate that the caller is a super admin
  IF NOT fn_is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admins can create staff accounts';
  END IF;

  -- 1. Insert into auth.users (Supabase internal auth table)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    gen_random_uuid(), 
    'authenticated', 
    'authenticated', 
    email, 
    crypt(password, gen_salt('bf')), 
    now(), 
    now(), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    jsonb_build_object('name', name, 'role', role), 
    now(), 
    now(), 
    '', 
    '', 
    '', 
    ''
  ) RETURNING id INTO new_user_id;

  -- 2. Insert into auth.identities to allow login (omit generated email column)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text,
    jsonb_build_object('sub', new_user_id, 'email', email),
    'email',
    now(),
    now(),
    now()
  );

  -- 3. Insert into public.staff_users
  INSERT INTO public.staff_users (
    id, name, email, role, is_active, created_at, updated_at
  ) VALUES (
    new_user_id, name, email, role, true, now(), now()
  );

  -- 4. Insert into public.branch_assignments if a branch is provided
  IF branch_id IS NOT NULL THEN
    INSERT INTO public.branch_assignments (staff_user_id, branch_id)
    VALUES (new_user_id, branch_id);
  END IF;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
