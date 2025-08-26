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
  signIn: async (credentials) => {
    console.warn('AuthContext not initialized. Falling back to direct AuthService.signIn.');
    return AuthService.signIn(credentials);
  },
  signOut: async () => {
    console.warn('AuthContext not initialized. Falling back to direct AuthService.signOut.');
    return AuthService.signOut();
  },
  isLoading: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user was previously logged in
  useEffect(() => {
    console.log("useAuth: Checking for previously logged in user");
    const currentUser = AuthService.getCurrentPlayer();
    
    console.log("useAuth: Current user from storage:", currentUser);
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  // Sign in function
  const signIn = async (credentials: LoginCredentials): Promise<AuthPlayer> => {
    console.log("useAuth: signIn called with credentials:", credentials);
    try {
      setIsLoading(true);
      console.log("useAuth: Calling AuthService.signIn");
      const player = await AuthService.signIn(credentials);
      console.log("useAuth: Got player from AuthService:", player);
      setUser(player);
      return player;
    } catch (error) {
      console.error("useAuth: Error during signIn:", error);
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
