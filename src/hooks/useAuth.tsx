// Auth functionality removed for simplicity. Dummy hook provided for compatibility.
export function useAuth() {
  return {
    user: null,
    signIn: async () => {},
    signOut: async () => {},
  };
}
