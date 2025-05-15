/**
 * Development Debug Page
 * Only available in development environment
 * Provides tools for debugging authentication state, routing, and other development issues
 */
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import RouteDebugger from '@/components/dev/RouteDebugger';
import { LucideIcon, LogIn, LogOut, RefreshCw, Info, AlertCircle, AlertTriangle, User, Key, Network } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface SessionInfoProps {
  title: string;
  value: any;
}

const SessionInfo = ({ title, value }: SessionInfoProps) => {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="p-2 bg-muted rounded-md">
        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40">
          {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
        </pre>
      </div>
    </div>
  );
};

interface AuthDebugCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

const AuthDebugCard = ({ title, description, icon: Icon, children }: AuthDebugCardProps) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default function DevDebugPage() {
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<any>(null);
  const { user, loginMutation, logoutMutation } = useAuth();

  // Get session data from server (development only)
  const sessionQuery = useQuery({
    queryKey: ['/api/dev/session-debug'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/dev/session-debug');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching session data:', error);
        toast({
          title: 'Error fetching session data',
          description: 'This endpoint only works in development mode',
          variant: 'destructive',
        });
        return null;
      }
    },
    enabled: true,
  });

  const handleClearSession = async () => {
    try {
      await apiRequest('POST', '/api/dev/clear-session');
      toast({
        title: 'Session cleared',
        description: 'Your session has been cleared successfully',
      });
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Error clearing session:', error);
      toast({
        title: 'Error clearing session',
        description: 'There was an error clearing your session',
        variant: 'destructive',
      });
    }
  };

  const handleTestLogin = async () => {
    try {
      loginMutation.mutate(
        { username: 'bperdomo@zoho.com', password: 'Matchpro123!' },
        {
          onSuccess: () => {
            toast({
              title: 'Login successful',
              description: 'You have been logged in as the admin user',
            });
            // Refresh session data
            sessionQuery.refetch();
          },
          onError: (error) => {
            toast({
              title: 'Login failed',
              description: error.message,
              variant: 'destructive',
            });
          },
        }
      );
    } catch (error) {
      console.error('Error during test login:', error);
    }
  };

  const handleLogout = async () => {
    try {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          toast({
            title: 'Logout successful',
            description: 'You have been logged out',
          });
          // Refresh session data
          sessionQuery.refetch();
        },
        onError: (error: Error) => {
          toast({
            title: 'Logout failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Development Debug Tools</h1>
        <p className="text-muted-foreground">
          This page provides tools to help debug the application in development mode. These tools are only available in
          the development environment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <AuthDebugCard
            title="Authentication Status"
            description="Current authentication status and user information"
            icon={User}
          >
            <SessionInfo
              title="Authentication State"
              value={user ? 'Authenticated' : 'Not Authenticated'}
            />
            {user && <SessionInfo title="Current User" value={user} />}
            <div className="flex gap-2">
              <Button onClick={handleTestLogin} disabled={!!user}>
                <LogIn className="mr-2 h-4 w-4" />
                Test Login
              </Button>
              <Button onClick={handleLogout} disabled={!user} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </AuthDebugCard>

          <AuthDebugCard
            title="Session Management"
            description="View and manipulate the current session"
            icon={Key}
          >
            {sessionQuery.isLoading ? (
              <div className="flex justify-center p-4">
                <RefreshCw className="animate-spin h-6 w-6 text-muted-foreground" />
              </div>
            ) : sessionQuery.data ? (
              <>
                <SessionInfo title="Session ID" value={sessionQuery.data.id} />
                <SessionInfo title="Session Data" value={sessionQuery.data.session} />
                <SessionInfo title="Cookies" value={sessionQuery.data.cookies} />
                <Button onClick={handleClearSession} variant="destructive">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Clear Session
                </Button>
              </>
            ) : (
              <div className="p-4 border rounded-md bg-muted/50 text-muted-foreground text-sm">
                <AlertTriangle className="inline-block mr-2 h-4 w-4" />
                Session data is not available. This endpoint only works in development mode.
              </div>
            )}
          </AuthDebugCard>
        </div>

        <div>
          <AuthDebugCard
            title="Route Debugging"
            description="Analyze and debug current route and location information"
            icon={Network}
          >
            <RouteDebugger />
          </AuthDebugCard>

          <AuthDebugCard
            title="Development Information"
            description="Environment and configuration details"
            icon={Info}
          >
            <SessionInfo title="Environment" value={import.meta.env.MODE} />
            <SessionInfo
              title="Base URL"
              value={`${window.location.protocol}//${window.location.host}`}
            />
            <SessionInfo title="User Agent" value={navigator.userAgent} />
          </AuthDebugCard>
        </div>
      </div>
    </div>
  );
}