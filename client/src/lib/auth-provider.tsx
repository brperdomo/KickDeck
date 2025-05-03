import { createContext, useContext, ReactNode } from "react";
import { useUser, User } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // Use the auth hook with admin force-enabling
  const authData = useAuth();
  
  // Create a properly typed context value
  const contextValue: AuthContextType = {
    user: authData.user || null, // Ensure we never pass undefined
    isLoading: authData.isLoading,
    error: authData.error,
    loginMutation: authData.loginMutation,
    logoutMutation: authData.logoutMutation,
    registerMutation: authData.registerMutation
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}