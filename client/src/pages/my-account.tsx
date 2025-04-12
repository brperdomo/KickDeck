import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { Loader2, Save, User, Lock, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/layouts/MemberLayout";

// Form validation schemas
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string()
    .regex(/^(\+1|1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, "Invalid phone number")
    .optional()
    .or(z.literal('')),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

// Phone number formatter
const formatPhoneNumber = (value: string) => {
  if (!value) return '';

  // Strip all non-numeric characters
  const cleaned = value.replace(/\D/g, '');

  // Format only if we have exactly 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Return the cleaned number if not 10 digits
  return cleaned;
};

export default function MyAccount() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { register, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, setValue } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }
  });

  // Custom phone input handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setValue('phone', formattedValue);
  };

  const { register: passwordRegister, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPasswordForm } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema)
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/user/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      resetPasswordForm();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <MemberLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 max-w-4xl mx-auto"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="text-muted-foreground">Manage your personal information and password</p>
          </div>
        </div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="font-medium">First Name *</Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        className="pl-10"
                        {...register("firstName")}
                        aria-invalid={!!profileErrors.firstName}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                    {profileErrors.firstName && (
                      <p className="text-sm text-destructive font-medium">{profileErrors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="font-medium">Last Name *</Label>
                    <div className="relative">
                      <Input
                        id="lastName"
                        className="pl-10"
                        {...register("lastName")}
                        aria-invalid={!!profileErrors.lastName}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                    {profileErrors.lastName && (
                      <p className="text-sm text-destructive font-medium">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">Email Address *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      {...register("email")}
                      aria-invalid={!!profileErrors.email}
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                  </div>
                  {profileErrors.email && (
                    <p className="text-sm text-destructive font-medium">{profileErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-medium">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      {...register("phone")}
                      onChange={(e) => {
                        register("phone").onChange(e); // Keep react-hook-form updated
                        handlePhoneChange(e); // Apply formatting
                      }}
                      aria-invalid={!!profileErrors.phone}
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </div>
                  </div>
                  {profileErrors.phone && (
                    <p className="text-sm text-destructive font-medium">{profileErrors.phone.message}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="px-6"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="font-medium">Current Password *</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type="password"
                        className="pl-10"
                        {...passwordRegister("currentPassword")}
                        aria-invalid={!!passwordErrors.currentPassword}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-destructive font-medium">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="font-medium">New Password *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type="password"
                        className="pl-10"
                        {...passwordRegister("newPassword")}
                        aria-invalid={!!passwordErrors.newPassword}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-destructive font-medium">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-medium">Confirm New Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="pl-10"
                        {...passwordRegister("confirmPassword")}
                        aria-invalid={!!passwordErrors.confirmPassword}
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive font-medium">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isChangingPassword}
                    className="px-6"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MemberLayout>
  );
}