import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { z } from "zod";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { loginMutation, user, authState, setAuthState } = useAuth();

  const [location, setLocation] = useLocation();
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);

  // Check for logout message and handle redirection parameters
  useEffect(() => {
    // Handle logout message
    const message = sessionStorage.getItem('logout_message');
    if (message) {
      console.log('Found logout message in session storage:', message);
      setLogoutMessage(message);
      sessionStorage.removeItem('logout_message');
    }

    // Handle redirect parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    const eventId = urlParams.get('eventId');
    
    if (redirectParam) {
      console.log('Found redirect parameter:', redirectParam);
      const decodedRedirect = decodeURIComponent(redirectParam);
      sessionStorage.setItem('redirectAfterAuth', decodedRedirect);
    } else if (eventId) {
      console.log('Found eventId in URL parameters:', eventId);
      const redirectUrl = `/register/event/${eventId}`;
      sessionStorage.setItem('redirectAfterAuth', redirectUrl);
    }
  }, []);

  // Form setup
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: LoginFormData) {
    try {
      console.log('Submitting login with email:', data.email);
      loginForm.clearErrors();
      
      // Update auth state to indicate login is in progress
      setAuthState('logging-in');
      
      // Perform login
      const userData = await loginMutation.mutateAsync(data);
      
      console.log('Login successful, user data:', userData);
      console.log('Login successful, user data type:', typeof userData);
      console.log('Login successful, user data fields:', userData ? Object.keys(userData) : 'No userData');
      
      // Check if the user has admin privileges - check if data is wrapped in a user object or is direct
      let userObject;
      if (userData && typeof userData === 'object' && 'user' in userData) {
        userObject = userData.user;
        console.log('Using user object:', userObject);
      } else {
        userObject = userData;
        console.log('Using direct userData:', userObject);
      }
      
      // Check for strict equality to ensure isAdmin is actually true
      const isAdmin = userObject && userObject.isAdmin === true;
      
      // Check if there's a redirect after auth stored in session storage
      const redirectAfterAuth = sessionStorage.getItem('redirectAfterAuth');
      let targetPath;
      
      if (redirectAfterAuth) {
        console.log(`Found redirect after auth: ${redirectAfterAuth}`);
        targetPath = redirectAfterAuth;
        // Clear the stored redirect path
        sessionStorage.removeItem('redirectAfterAuth');
      } else {
        // Determine the appropriate dashboard - Admin and Dashboard are separate portals
        targetPath = isAdmin ? '/admin' : '/dashboard';
        console.log(`No redirect path found, using default: ${targetPath}`);
      }
      
      console.log(`Login successful, redirecting to ${targetPath}`);
      
      // Set auth state to authenticated before redirect
      setAuthState('authenticated');
      
      // Add a small delay to ensure state update happens before redirect
      setTimeout(() => {
        // Force a reload when navigating to ensure fresh state
        window.location.href = targetPath;
      }, 100);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      setAuthState('unauthenticated');
      
      // Show appropriate error messages
      if (error.message?.toLowerCase().includes("password")) {
        loginForm.setError("password", { message: "Invalid password" });
      } else if (error.message?.toLowerCase().includes("email") || 
                error.message?.toLowerCase().includes("user not found")) {
        loginForm.setError("email", { message: "Email not found or invalid" });
      } else {
        // Generic error
        loginForm.setError("root.serverError", { 
          message: error.message || "Login failed. Please check your credentials and try again."
        });
        
        toast({
          title: "Login failed",
          description: error.message || "An error occurred during login",
          variant: "destructive"
        });
      }
    }
  }

  // If already authenticated, redirect to dashboard
  if (user && authState === 'authenticated') {
    console.log("User already authenticated, redirecting to dashboard", user);
    console.log("User already authenticated, user type:", typeof user);
    console.log("User already authenticated, user fields:", user ? Object.keys(user) : 'No user');
    
    // Check if user has admin privileges - make sure we use the right property
    // Use type assertion to safely access properties
    const userObject = user;
    const isAdmin = userObject && (userObject as any).isAdmin === true;
                     
    console.log("User already authenticated, isAdmin:", isAdmin);
                     
    // Immediate redirect to dashboard - Admin and Dashboard are separate portals
    const directTarget = isAdmin ? '/admin' : '/dashboard';
    
    // Direct redirect to appropriate dashboard
    setTimeout(() => {
      console.log(`User already authenticated, redirecting to ${directTarget}`);
      window.location.href = directTarget;
    }, 250);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h3 className="text-xl mb-2">You're already logged in!</h3>
        <p className="text-sm text-muted-foreground mb-4">Redirecting you to your dashboard...</p>
        <div className="flex space-x-3">
          <button 
            onClick={() => window.location.href = '/admin/dashboard'} 
            className="bg-primary text-white px-3 py-1 rounded text-sm">
            Admin Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="bg-secondary px-3 py-1 rounded text-sm">
            Member Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0c16]">
      <Card className="w-full max-w-md bg-[#3d3a98] border-0 shadow-xl">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center mb-2">
            <img
              src="/uploads/MatchProAI_Linear_BlackNOBUFFER.png"
              alt="MatchPro Logo"
              className="h-12 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Let's get you signed in
          </CardTitle>
          {logoutMessage && (
            <div className={`mt-2 px-4 py-2 rounded-md text-sm font-medium ${
              window.location.search.includes('forced') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {logoutMessage}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form
              onSubmit={loginForm.handleSubmit(onSubmit)}
              className="space-y-5"
              id="login-form"
              name="login"
              autoComplete="on"
            >
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="username email"
                        className="bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-yellow-200" />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        className="bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-yellow-200" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-white hover:bg-white/90 text-[#3d3a98] font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <div className="mt-4 text-center">
                <Link to="/forgot-password" className="text-white hover:text-white/80 text-sm">
                  Forgot Password?
                </Link>
                <div className="mt-2 text-white text-sm">
                  New to MatchPro? <Link to="/register" className="text-white hover:text-white/80 font-bold">Register Here</Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}