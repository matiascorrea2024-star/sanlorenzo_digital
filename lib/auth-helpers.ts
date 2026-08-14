import { supabase } from "./supabase";

export type AuthUser = {
  id: string;
  email: string;
  role?: "user" | "business_owner" | "admin";
};

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { name?: string; role?: string }
) {
  const { data, error } = await supabase().auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase().auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase().auth.getUser();
  if (error) return null;
  return user;
}

export async function resetPassword(email: string) {
  const { error } = await supabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  });
  if (error) throw error;
}
