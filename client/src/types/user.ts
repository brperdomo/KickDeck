/**
 * Extended User Interface
 * 
 * This interface extends the base User type to include properties needed for
 * user role verification and authentication processes.
 */
export interface ExtendedUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  roles?: string[];
  [key: string]: any; // Allow for additional properties
}

/**
 * Helper function to check if a user has admin privileges
 */
export function isUserAdmin(user: ExtendedUser | null): boolean {
  if (!user) return false;
  
  // Check if user has isAdmin flag
  if (user.isAdmin === true) return true;
  
  // Check if user has admin roles
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(role => 
      ['super_admin', 'admin', 'tournament_admin', 'score_admin', 'finance_admin'].includes(role)
    );
  }
  
  return false;
}