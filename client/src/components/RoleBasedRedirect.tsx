import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

/**
 * RoleBasedRedirect Component
 * 
 * Redirects users based on their role when they access restricted areas:
 * - Regular users trying to access admin routes are redirected to the dashboard
 * - Admin users trying to access member routes are redirected to the admin panel
 */
export function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Wait until user data is loaded and we have a user
    if (isLoading || !user) return;

    // Log initial state for debugging
    console.log("RoleBasedRedirect activated", { 
      path: location, 
      isAdmin: user?.isAdmin, 
      userInfo: `${user.firstName} ${user.lastName} (${user.email})`
    });
    
    // Extract the current path for easier checking
    const path = location.toLowerCase();
    
    // Don't redirect if the user is in the process of registration or other special flows
    if (path.includes('/register/event/') || 
        path.includes('/event/') || 
        path.includes('/reset-password') ||
        path.includes('/forgot-password') ||
        path.includes('/auth-logged-out') ||
        path.includes('/auth') ||
        path.includes('/login') ||
        path.includes('/logout')) {
      console.log("Path excluded from redirection:", path);
      return;
    }
    
    // Handle admin routes when user is not an admin
    if ((path === '/admin' || path.startsWith('/admin/')) && !user.isAdmin) {
      console.log("User is not an admin, redirecting to dashboard");
      window.location.href = '/dashboard';
      return;
    }
    
    // Handle member routes when user is only an admin
    if ((path === '/dashboard' || path.startsWith('/dashboard/')) && user.isAdmin) {
      // If we want to check if user has both admin and member permissions, we would do it here
      // For now, redirect all admins to admin dashboard
      console.log("Admin user accessing member route, redirecting to admin panel");
      window.location.href = '/admin';
      return;
    }
    
    // Handle root path based on user's role
    if (path === '/') {
      if (user.isAdmin) {
        console.log("Admin user at root path, redirecting to admin panel");
        window.location.href = '/admin';
      } else {
        console.log("Regular user at root path, redirecting to dashboard");
        window.location.href = '/dashboard';
      }
      return;
    }
    
  }, [user, isLoading, location]);
  
  // This component doesn't render anything, it just performs redirects
  return null;
}