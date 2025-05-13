import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import AuthLayout from "@/components/layouts/AuthLayout";
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
  const { loginMutation, user } = useAuth();

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
  const form = useForm<LoginFormData>({
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
      form.clearErrors();
      
      // Perform login
      await loginMutation.mutateAsync(data);
      
      // Check if there's a redirect after auth stored in session storage
      const redirectAfterAuth = sessionStorage.getItem('redirectAfterAuth');
      let targetPath;
      
      if (redirectAfterAuth) {
        console.log(`Found redirect after auth: ${redirectAfterAuth}`);
        targetPath = redirectAfterAuth;
        // Clear the stored redirect path
        sessionStorage.removeItem('redirectAfterAuth');
      } else {
        // Default to main dashboard
        targetPath = "/";
      }
      
      console.log(`Login successful, redirecting to ${targetPath}`);
      setLocation(targetPath);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show appropriate error messages
      if (error.message?.toLowerCase().includes("password")) {
        form.setError("password", { message: "Invalid password" });
      } else if (error.message?.toLowerCase().includes("email") || 
                error.message?.toLowerCase().includes("user not found")) {
        form.setError("email", { message: "Email not found or invalid" });
      } else {
        // Generic error
        form.setError("root.serverError", { 
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
  if (user) {
    // Check if user has admin privileges
    const isAdmin = user.isAdmin;
    
    // Redirect to appropriate dashboard - Admin and Dashboard are separate portals
    const target = isAdmin ? '/admin' : '/dashboard';
    setLocation(target);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h3 className="text-xl mb-2">You're already logged in!</h3>
        <p className="text-sm text-muted-foreground mb-4">Redirecting you to your dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700">
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            {logoutMessage && (
              <div className={`mt-2 px-4 py-2 rounded-md text-sm font-medium ${
                window.location.search.includes('forced') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {logoutMessage}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
                id="login-form"
                name="login"
                autoComplete="on"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="username email"
                          placeholder="youremail@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
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
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot Password?
                  </Link>
                  <div className="mt-2 text-sm">
                    New to MatchPro? <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold">Register Here</Link>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <div className="hidden md:flex md:w-1/2 bg-indigo-800 flex-col items-center justify-center relative">
        <div className="absolute inset-0">
          <AnimatedBackground />
        </div>
        <div className="z-10 text-white max-w-lg mx-auto p-8 space-y-6 text-center">
          <h1 className="text-4xl font-bold mb-6">MatchPro Tournament Management</h1>
          <p className="text-xl">
            The complete solution for tournament organizers and teams. 
            Login to access your dashboard and manage your tournaments.
          </p>
        </div>
      </div>
    </div>
  );
}