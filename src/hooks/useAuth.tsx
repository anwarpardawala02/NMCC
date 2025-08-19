// Auth functionality removed for simplicity. Dummy hook provided for compatibility.
export function useAuth() {
  return {
    user: undefined as any, // allows user?.id, user?.is_admin, etc.
    signIn: async (_email?: string) => {},
    signOut: async () => {},
  };
}
