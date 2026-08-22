-- En instalaciones nuevas el usuario administrador todavía no existe.
-- La cuenta y su contraseña deben crearse desde Auth, nunca desde una
-- migración versionada.
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'matiascorrea2024@gmail.com' LIMIT 1;

  IF uid IS NOT NULL THEN
    INSERT INTO public.user_profiles (user_id, display_name, role)
    VALUES (uid, 'Matias', 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin', display_name = 'Matias';
  END IF;
END $$;
