import { useState, useEffect, useContext, createContext } from 'react';
import { AuthService } from '../lib/authService';
import type { AuthPlayer, LoginCredentials } from '../lib/authService';

interface AuthContextType {
  user: AuthPlayer | null;
  signIn: (credentials: LoginCredentials) => Promise<AuthPlayer>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => { throw new Error('Not implemented'); },
  signOut: async () => {},
  isLoading: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user was previously logged in
  useEffect(() => {
    const currentUser = AuthService.getCurrentPlayer();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  // Sign in function
  const signIn = async (credentials: LoginCredentials): Promise<AuthPlayer> => {
    try {
      setIsLoading(true);
      const player = await AuthService.signIn(credentials);
      setUser(player);
      return player;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await AuthService.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    signIn,
    signOut,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
