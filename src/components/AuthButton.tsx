import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    const email = prompt('Enter your email for a magic link:');
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Check your email for the sign-in link.');
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return user ? (
    <button onClick={signOut}>Sign out ({user.email})</button>
  ) : (
    <button onClick={signIn}>Sign in</button>
  );
}
