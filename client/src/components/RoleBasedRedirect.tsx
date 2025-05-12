import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

/**
 * ProtectedRoute Component
 * 
 * Redirects users based on their role when they access restricted areas:
 * - Regular users trying to access admin routes are redirected to the dashboard
 * - Admin users trying to access member routes are redirected to the admin panel
 * 
 * This component is meant to be used alongside the <Route> component in App.tsx
 */
export function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Don't do anything if we're still loading or there's no user
    if (isLoading || !user) return;

    // Log for debugging
    console.log("RoleBasedRedirect checking access", { 
      path: location, 
      isAdmin: user?.isAdmin
    });
    
    // Extract current path
    const path = location.toLowerCase();
    
    // Skip redirects for non-protected paths
    const nonProtectedPaths = [
      '/register', 
      '/event', 
      '/reset-password',
      '/forgot-password',
      '/auth',
      '/login',
      '/logout',
      '/auth-logged-out'
    ];
    
    // Check if the current path matches any of the non-protected paths
    if (nonProtectedPaths.some(nonProtectedPath => path.includes(nonProtectedPath))) {
      console.log("Path is non-protected:", path);
      return;
    }
    
    // Handle admin routes when user is not an admin
    if ((path === '/admin' || path.startsWith('/admin/')) && !user.isAdmin) {
      console.log("Non-admin accessing admin route, redirecting to dashboard");
      setLocation('/dashboard');
      return;
    }
    
    // Handle member routes when user is an admin only
    if ((path === '/dashboard' || path.startsWith('/dashboard/')) && user.isAdmin) {
      console.log("Admin accessing member route, redirecting to admin panel");
      setLocation('/admin');
      return;
    }
    
    // Handle root path based on role
    if (path === '/') {
      const targetPath = user.isAdmin ? '/admin' : '/dashboard';
      console.log(`User at root path, redirecting to ${targetPath}`);
      setLocation(targetPath);
      return;
    }
    
  }, [user, isLoading, location, setLocation]);
  
  // No rendering - this is just for redirection
  return null;
}