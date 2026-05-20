import type { Provider } from '@supabase/supabase-js';
import { supabase } from './supabase';

const redirectTo = `${window.location.origin}/auth/callback`;

export async function signInWithProvider(provider: Provider = 'google') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
