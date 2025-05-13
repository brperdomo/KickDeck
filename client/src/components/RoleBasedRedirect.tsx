import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

/**
 * RoleBasedRedirect Component
 * 
 * Intelligently redirects users based on their role:
 * - Root path (/) redirects to /admin for admins or /dashboard for regular members
 * - Regular users trying to access admin routes are redirected to the dashboard
 * - Admin users trying to access member routes are redirected to the admin panel
 * - Non-protected routes are left alone for all users
 * 
 * This component works in conjunction with ProtectedRoute for a complete
 * role-based access control system throughout the application.
 */
export function RoleBasedRedirect() {
  const { user, isLoading, authState, setAuthState } = useAuth();
  const [location, setLocation] = useLocation();
  const [redirectCount, setRedirectCount] = useState(0);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  useEffect(() => {
    // Track redirects to prevent loops
    if (redirectCount > 5) {
      console.error("Too many redirects detected! Stopping to prevent infinite loop.");
      setAuthState('authenticated'); // Force auth state to authenticated to stop redirects
      return;
    }
    
    // Enhanced logging for debugging
    console.log("RoleBasedRedirect - Current state:", {
      isLoading,
      authState,
      user,
      location,
      redirectCount
    });

    // Don't do anything if we're still loading or in a transitional state
    if (isLoading || authState === 'checking' || authState === 'logging-in' || 
        authState === 'logging-out' || authState === 'redirecting') {
      console.log("RoleBasedRedirect - Still loading or in transition, skipping redirect", { authState });
      return;
    }

    // If no user data and not in a loading state, redirect to auth for protected routes
    if (!user && authState === 'unauthenticated') {
      // Only redirect to auth for protected routes
      const path = location.toLowerCase();
      const protectedRoutes = ['/admin', '/dashboard'];
      
      // Check if current path is a protected route or a subpath of one
      const isProtected = protectedRoutes.some(route => 
        path === route || path.startsWith(`${route}/`)
      );
      
      if (isProtected) {
        console.log("No authenticated user for protected route, redirecting to auth");
        sessionStorage.setItem('redirectAfterAuth', location);
        setAuthState('redirecting');
        setLocation('/auth');
      }
      return;
    }

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
    
    // Only proceed if we have a valid user and are in authenticated state
    if (user && authState === 'authenticated') {
      // Handle root path based on role - redirect to appropriate dashboard
      if (path === '/') {
        const targetPath = user.isAdmin === true ? '/admin' : '/dashboard';
        console.log(`User at root path, redirecting to ${targetPath}`, { isAdmin: user.isAdmin });
        
        // Set auth state to redirecting to show proper UI feedback
        setAuthState('redirecting');
        
        // Force a direct navigation to the target path
        window.location.href = targetPath;
        return;
      }
      
      // Handle admin routes - only allow access to admins
      if (path === '/admin' || path.startsWith('/admin/')) {
        // If user is not an admin, redirect to dashboard
        if (user.isAdmin !== true) {
          console.log("Non-admin user tried to access admin route, redirecting to dashboard");
          setAuthState('redirecting');
          setLocation('/dashboard');
          return;
        }
        
        // Admin user is allowed access to admin routes
        console.log("Admin access confirmed");
        return;
      }
      
      // Handle dashboard routes - for member-specific pages
      if (path === '/dashboard' || path.startsWith('/dashboard/')) {
        // Allow both admins and members to access dashboard routes
        console.log("Member/dashboard access confirmed");
        return;
      }
    }
  }, [user, isLoading, authState, location, setLocation, redirectCount, setAuthState, hasRedirected]);
  
  // Show loading indicator during redirects to prevent white flash
  if (authState === 'redirecting') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting...</span>
      </div>
    );
  }
  
  // No rendering when not redirecting
  return null;
}