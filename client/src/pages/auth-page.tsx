import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user"; // Added from original code
import { type InsertUser } from "@db/schema"; // Added from original code
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
// Shared password schema  (Retained from original)
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// Login schema (Retained from original)
const loginSchema = z.object({
  loginEmail: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
});

// Registration schema with only email (From edited code)
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

// Function to check email availability (Retained from original)
async function checkEmailAvailability(email: string): Promise<{ available: boolean }> {
  const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to check email availability");
  }
  return response.json();
}

export default function AuthPage() {
  const { toast } = useToast();
  const { login, register: registerUser } = useUser(); // Added from original code
  const [isRegistering, setIsRegistering] = useState(false);

  // Email availability check mutation (Retained from original, but unused in simplified form)
  const emailCheckMutation = useMutation({
    mutationFn: checkEmailAvailability,
    onError: (error) => {
      console.error("Email check failed:", error);
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginEmail: "",
      password: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: LoginFormData | RegisterFormData) {
    try {
      if (isRegistering) {
        const submitData: InsertUser = { // Added from original code
          email: (data as RegisterFormData).email,
          username: "", // Placeholder -  No username in simplified registration
          password: "", // Placeholder - No password in simplified registration
          firstName: "", // Placeholder - No first name in simplified registration
          lastName: "", // Placeholder - No last name in simplified registration
          phone: null, // Placeholder - No phone in simplified registration
          isParent: false,
          isAdmin: false,
          createdAt: new Date().toISOString(),
        };
        const result = await registerUser(submitData);
        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
          return;
        }
        toast({
          title: "Success",
          description: "Registration successful",
        });
      } else {
        const loginData = data as LoginFormData;
        const result = await login({
          username: loginData.loginEmail,
          password: loginData.password,
          email: loginData.loginEmail,
          firstName: "",
          lastName: "",
          phone: null,
          isParent: false,
          isAdmin: false,
          createdAt: new Date().toISOString(),
        });

        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
          return;
        }

        toast({
          title: "Success",
          description: "Login successful",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="container max-w-lg mx-auto relative z-10">
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <Trophy className="h-16 w-16 text-green-600 mb-4" />
              <CardTitle className="text-3xl font-bold">Sign In to MatchPro</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={isRegistering ? "register" : "login"}
              onValueChange={(v) => {
                setIsRegistering(v === "register");
                loginForm.reset();
                registerForm.reset();
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {isRegistering ? (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      Register
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="loginEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      Login
                    </Button>
                  </form>
                </Form>
              )}

              {!isRegistering && (
                <div className="text-center mt-4">
                  <Link href="/forgot-password">
                    <Button variant="link" className="text-sm text-green-600" type="button">
                      Forgot Password?
                    </Button>
                  </Link>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}