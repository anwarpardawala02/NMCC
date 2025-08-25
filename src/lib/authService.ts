import { supabase } from './supabaseClient';

// Player authentication types
export interface AuthPlayer {
  id: string;
  email: string;
  full_name: string;
  role: string;
  login_name: string;
  is_admin: boolean;
}

export interface LoginCredentials {
  login_name: string;
  password: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  phone: string;
  login_name: string;
  password: string;
}

export interface PasswordResetRequest {
  login_name: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  playerId: string;
  oldPassword: string;
  newPassword: string;
}

// Custom authentication error
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Authentication service
export class AuthService {
  // Authenticate user against Supabase players table
  static async signIn(credentials: LoginCredentials): Promise<AuthPlayer> {
    console.log("Authenticating with login_name:", credentials.login_name);

    try {
      // Call the database function to check credentials and get player data
      type AuthResponse = {
        id: string;
        email: string;
        full_name: string;
        role: string;
        login_name: string;
        is_admin: boolean;
      };




      const { data: authDataRaw, error: authError } = await supabase
        .rpc('check_player_password', {
          p_login_name: credentials.login_name,
          p_password: credentials.password
        })
        .single();

      const authData = authDataRaw as AuthResponse | null;

      if (authError) {
        console.error("Authentication failed:", authError);
        throw new AuthError("Invalid username or password.");
      }

      if (!authData) {
        throw new AuthError("Invalid credentials.");
      }

      // Create the authenticated player object
      const authenticatedPlayer: AuthPlayer = {
        id: authData.id,
        email: authData.email,
        full_name: authData.full_name,
        role: authData.role,
        login_name: authData.login_name,
        is_admin: authData.is_admin
      };

      // Store the player in localStorage
      localStorage.setItem('cricket_club_player', JSON.stringify(authenticatedPlayer));
      console.log("User authenticated:", authenticatedPlayer);

      return authenticatedPlayer;
    } catch (error) {
      console.error("Authentication error:", error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError("Authentication failed");
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    localStorage.removeItem('cricket_club_player');
    console.log("User signed out");
  }

  // Get current authenticated player
  static getCurrentPlayer(): AuthPlayer | null {
    try {
      const playerData = localStorage.getItem('cricket_club_player');
      if (!playerData) {
        console.log("No authenticated user found");
        return null;
      }
      
      const player = JSON.parse(playerData) as AuthPlayer;
      console.log("Found authenticated user:", player);
      return player;
    } catch (error) {
      console.error("Error retrieving user data:", error);
      localStorage.removeItem('cricket_club_player');
      return null;
    }
  }

  // Register a new player
  static async register(data: RegisterData): Promise<string> {
    try {
      // Try with the direct insert function first (without login_name or password)
      try {
        console.log('Attempting direct player insert with:', {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone
        });
        
        const { data: directResult, error: directError } = await supabase
          .rpc('direct_player_insert', {
            p_full_name: data.full_name,
            p_email: data.email,
            p_phone: data.phone
          });
          
        console.log('Direct insert result:', directResult);
        
        if (directError) {
          console.error('Direct insert error details:', directError);
          console.error('Direct insert error message:', directError.message);
          console.error('Direct insert error code:', directError.code);
          console.error('Direct insert error details:', directError.details);
        } else if (directResult) {
          return directResult; // Return if successful
        }
      } catch (directErr) {
        console.error('Direct insert function failed:', directErr);
      }
      
      // Now try the actual registration if direct insert didn't work
      console.log('Attempting full registration with login_name and password');
      const { data: result, error } = await supabase
        .rpc('register_player', {
          p_full_name: data.full_name,
          p_email: data.email,
          p_phone: data.phone,
          p_login_name: data.login_name,
          p_password: data.password
        });

      if (error) {
        console.error('Registration error details:', error);
        throw new AuthError(error.message);
      }
      if (!result) throw new AuthError('Registration failed');
      
      return result;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new AuthError(error.message || 'Failed to register');
    }
  }

  // Request password reset
  static async requestPasswordReset(data: PasswordResetRequest): Promise<string> {
    try {
      // First, generate the reset token
      const { data: token, error } = await supabase
        .rpc('create_password_reset_token', {
          p_login_name: data.login_name
        });

      if (error) throw new AuthError(error.message);
      if (!token) throw new AuthError('Username not found or account inactive');
      
      // Then, get the user's email based on login_name
      const { data: userData, error: userError } = await supabase
        .from('players')
        .select('email')
        .eq('login_name', data.login_name)
        .single();
        
      if (userError || !userData) {
        console.error('Failed to retrieve user email:', userError);
        // Don't throw here, we still want to return the token even if email fails
      } else {
        try {
          // Call the Edge Function to send the reset email
          const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
          const projectRef = SUPABASE_URL.match(/https:\/\/(.*?)\.supabase/)?.[1];
          
          if (projectRef) {
            console.log('Sending password reset email to:', userData.email);
            
            const resetEmailResponse = await fetch(
              `https://${projectRef}.functions.supabase.co/send-reset-email`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userData.email, token })
              }
            );
            
            const resetEmailResult = await resetEmailResponse.json();
            console.log('Reset email result:', resetEmailResult);
            
            if (!resetEmailResponse.ok) {
              console.error('Failed to send reset email:', resetEmailResult);
            }
          } else {
            console.error('Could not determine Supabase project reference');
          }
        } catch (emailError) {
          console.error('Error sending reset email:', emailError);
          // Again, don't throw, we want to return the token regardless
        }
      }
      
      return token;
    } catch (error: any) {
      console.error('Password reset request error:', error);
      throw new AuthError(error.message || 'Failed to request password reset');
    }
  }

  // Reset password with token
  static async resetPassword(data: PasswordResetConfirm): Promise<boolean> {
    try {
      const { data: success, error } = await supabase
        .rpc('reset_password_with_token', {
          p_token: data.token,
          p_new_password: data.newPassword
        });

      if (error) throw new AuthError(error.message);
      if (!success) throw new AuthError('Invalid or expired token');
      
      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new AuthError(error.message || 'Failed to reset password');
    }
  }

  // Change password
  static async changePassword(data: ChangePasswordData): Promise<boolean> {
    try {
      const { data: success, error } = await supabase
        .rpc('change_player_password', {
          p_player_id: data.playerId,
          p_old_password: data.oldPassword,
          p_new_password: data.newPassword
        });

      if (error) throw new AuthError(error.message);
      if (!success) throw new AuthError('Current password is incorrect');
      
      return true;
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new AuthError(error.message || 'Failed to change password');
    }
  }

  // Check if user is admin
  static isAdmin(): boolean {
    const player = this.getCurrentPlayer();
    return player?.role === 'admin';
  }

  // Check if user has specific role
  static hasRole(role: string): boolean {
    const player = this.getCurrentPlayer();
    return player?.role === role;
  }
}
