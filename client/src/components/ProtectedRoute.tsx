import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  requiredRole?: "admin" | "member";
  component: ReactNode | (() => JSX.Element);
};

/**
 * ProtectedRoute Component
 * 
 * A route component that protects routes based on authentication status and roles.
 * - If the user is not logged in, they are redirected to the auth page
 * - If an admin role is required and the user is not an admin, they are redirected
 * - If a member role is required and the user is an admin, they can still access the route
 * 
 * @param path - The route path to match
 * @param requiredRole - Optional role requirement ("admin" or "member")
 * @param component - The component to render when conditions are met
 */
export function ProtectedRoute({ 
  path, 
  requiredRole,
  component: Component 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        // Show loading indicator while checking auth
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Redirect to login if not authenticated
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Role-based checks
        if (requiredRole === "admin" && !user.isAdmin) {
          return <Redirect to="/dashboard" />;
        }

        // Render the component if all checks pass
        return typeof Component === "function" 
          ? <Component />
          : Component;
      }}
    </Route>
  );
}