import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type InsertUser } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { SoccerFieldBackground } from "@/components/ui/SoccerFieldBackground";
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
import { Trophy } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";

// Login schema
const loginSchema = z.object({
  loginEmail: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { login } = useUser();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginEmail: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const result = await login({
        username: data.loginEmail,
        password: data.password,
        email: data.loginEmail,
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
      <SoccerFieldBackground className="opacity-50" />
      <div className="container max-w-lg mx-auto relative z-10">
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <Trophy className="h-16 w-16 text-green-600 mb-4" />
              <CardTitle className="text-3xl font-bold">Sign In to MatchPro</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form 
                onSubmit={loginForm.handleSubmit(onSubmit)} 
                className="space-y-4"
                id="login-form"
                name="login"
                autoComplete="on"
              >
                <FormField
                  control={loginForm.control}
                  name="loginEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="username email"
                          {...field}
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
                          autoComplete="current-password"
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
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    New to MatchPro?{" "}
                    <Link href="/register">
                      <a className="text-green-600 hover:text-green-700 font-semibold">
                        Register Here
                      </a>
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}