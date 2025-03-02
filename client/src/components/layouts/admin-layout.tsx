import React from "react";
import { AdminBanner } from "@/components/admin/AdminBanner";
import { useUser } from "@/hooks/use-auth";
import { useLocation } from "@/hooks/use-location";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
  showBanner?: boolean;
  backUrl?: string;
  title?: string;
}

export default function AdminLayout({
  children,
  showBanner = true,
  backUrl = "/admin",
  title,
}: AdminLayoutProps) {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  // Type guard function to check if user is admin
  function isAdminUser(user: any | null): boolean {
    return user !== null && user.isAdmin === true;
  }

  React.useEffect(() => {
    if (!user) {
      return; // Wait for user data to load
    }
    if (!isAdminUser(user)) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showBanner && <AdminBanner />}
      
      <div className="flex-1 container mx-auto px-4 py-6">
        {(backUrl || title) && (
          <div className="flex items-center gap-4 mb-6">
            {backUrl && (
              <Button
                variant="ghost"
                onClick={() => setLocation(backUrl)}
              >
                Back
              </Button>
            )}
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
}