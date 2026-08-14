-- Setea la contraseña de matiascorrea2024@gmail.com directo en
-- auth.users (el flujo de recovery por mail está roto por falta de
-- ruta, se arregla aparte) y confirma su email si no lo estaba.
-- Falla explícitamente (RAISE EXCEPTION) si el usuario todavía no
-- existe, en vez de actualizar 0 filas en silencio.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  affected integer;
  uid uuid;
BEGIN
  UPDATE auth.users
  SET encrypted_password = extensions.crypt('328726625Matias', extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE email = 'matiascorrea2024@gmail.com'
  RETURNING id INTO uid;

  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected = 0 THEN
    RAISE EXCEPTION 'No existe ningún usuario en auth.users con email matiascorrea2024@gmail.com -- creá la cuenta primero desde el Dashboard (Authentication > Users > Add user).';
  END IF;

  INSERT INTO public.user_profiles (user_id, display_name, role)
  VALUES (uid, 'Matias', 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin', display_name = 'Matias';
END $$;
