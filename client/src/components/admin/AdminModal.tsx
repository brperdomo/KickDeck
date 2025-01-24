import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { adminFormSchema } from "@db/schema";
import type { AdminFormValues } from "@db/schema";

const availableRoles = [
  { id: "super_admin", name: "Super Admin", description: "Full system access" },
  { id: "tournament_admin", name: "Tournament Admin", description: "Manage tournaments and events" },
  { id: "score_admin", name: "Score Admin", description: "Manage scores and results" },
  { id: "finance_admin", name: "Finance Admin", description: "Manage financial aspects" },
] as const;

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminModal({ open, onOpenChange }: AdminModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailToCheck, setEmailToCheck] = useState("");

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roles: [],
    },
  });

  // Email validation query
  const emailCheckQuery = useQuery({
    queryKey: ['checkEmail', emailToCheck],
    queryFn: async () => {
      if (!emailToCheck) return null;
      const response = await fetch(`/api/admin/check-email?email=${encodeURIComponent(emailToCheck)}`);
      if (!response.ok) {
        throw new Error('Failed to check email');
      }
      return response.json();
    },
    enabled: !!emailToCheck && emailToCheck.includes('@'),
  });

  // Debounced email check
  const handleEmailChange = useCallback((email: string) => {
    setEmailToCheck(email);
  }, []);

  const createAdminMutation = useMutation({
    mutationFn: async (data: AdminFormValues) => {
      const response = await fetch("/api/admin/administrators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/administrators"] });
      toast({
        title: "Success",
        description: "Administrator created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create administrator",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AdminFormValues) => {
    if (emailCheckQuery.data?.exists) {
      form.setError('email', {
        type: 'manual',
        message: 'This email is already registered'
      });
      return;
    }
    createAdminMutation.mutate(data);
  };

  // Handle role selection
  const toggleRole = (roleId: string) => {
    const currentRoles = form.getValues("roles");
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(id => id !== roleId)
      : [...currentRoles, roleId];
    form.setValue("roles", newRoles, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add New Administrator</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="john.doe@example.com"
                        onChange={(e) => {
                          field.onChange(e);
                          handleEmailChange(e.target.value);
                        }}
                      />
                      {emailCheckQuery.isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {emailCheckQuery.data?.exists && (
                    <p className="text-sm font-medium text-destructive">
                      This email is already registered
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administrator Roles</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {availableRoles.map((role) => (
                        <div
                          key={role.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            field.value.includes(role.id)
                              ? "border-primary bg-primary/5"
                              : "border-input hover:bg-accent"
                          }`}
                          onClick={() => toggleRole(role.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{role.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {role.description}
                              </p>
                            </div>
                            {field.value.includes(role.id) && (
                              <Badge variant="secondary">Selected</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Minimum 8 characters" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  createAdminMutation.isPending || 
                  emailCheckQuery.isLoading || 
                  emailCheckQuery.data?.exists ||
                  form.getValues("roles").length === 0
                }
              >
                {createAdminMutation.isPending ? "Creating..." : "Create Administrator"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}