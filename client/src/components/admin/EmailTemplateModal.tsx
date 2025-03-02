import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "@tinymce/tinymce-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { insertEmailTemplateSchema, type EmailTemplate } from "@db/schema/emailTemplates";
import type { z } from "zod";

const templateTypes = [
  { id: "registration", label: "Registration" },
  { id: "payment", label: "Payment" },
  { id: "password_reset", label: "Password Reset" },
  { id: "account_creation", label: "Account Creation" },
  { id: "reminder", label: "Reminder" },
] as const;

interface EmailTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
}

type FormValues = z.infer<typeof insertEmailTemplateSchema>;

export function EmailTemplateModal({
  open,
  onOpenChange,
  template,
}: EmailTemplateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(insertEmailTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "registration",
      subject: "",
      content: "",
      senderName: "",
      senderEmail: "",
      isActive: true,
      variables: [],
    },
  });

  useEffect(() => {
    if (template) {
      // Convert null values to undefined for the form
      const formData: FormValues = {
        name: template.name,
        description: template.description ?? undefined,
        type: template.type,
        subject: template.subject,
        content: template.content,
        senderName: template.senderName,
        senderEmail: template.senderEmail,
        isActive: template.isActive ?? true,
        variables: template.variables ?? [],
      };
      form.reset(formData);
    } else {
      form.reset({
        name: "",
        description: "",
        type: "registration",
        subject: "",
        content: "",
        senderName: "",
        senderEmail: "",
        isActive: true,
        variables: [],
      });
    }
  }, [template, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const endpoint = template
        ? `/api/admin/email-templates/${template.id}`
        : "/api/admin/email-templates";
      const response = await fetch(endpoint, {
        method: template ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Success",
        description: `Template ${template ? "updated" : "created"} successfully`,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Email Template" : "Create Email Template"}
          </DialogTitle>
          <DialogDescription>
            Create or modify email templates for various system notifications.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Welcome Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Subject</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter email subject" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Content</FormLabel>
                  <FormControl>
                    <Editor
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                      value={field.value}
                      onEditorChange={(content) => field.onChange(content)}
                      init={{
                        height: 400,
                        menubar: true,
                        plugins: [
                          "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                          "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                          "insertdatetime", "media", "table", "code", "help", "wordcount"
                        ],
                        toolbar: "undo redo | blocks | " +
                          "bold italic forecolor | alignleft aligncenter " +
                          "alignright alignjustify | bullist numlist outdent indent | " +
                          "removeformat | help",
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter sender name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter sender email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Inactive templates won't be used by the system
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {template ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { EmailTemplate } from "@db/schema/emailTemplates";

const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Template type is required"),
  subject: z.string().min(1, "Email subject is required"),
  content: z.string().min(1, "Email content is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Please enter a valid email address"),
  isActive: z.boolean().default(true),
  variables: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EmailTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
}

export function EmailTemplateModal({ open, onOpenChange, template }: EmailTemplateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "welcome",
      subject: "",
      content: "",
      senderName: "",
      senderEmail: "",
      isActive: true,
      variables: [],
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        type: template.type,
        subject: template.subject,
        content: template.content,
        senderName: template.senderName,
        senderEmail: template.senderEmail,
        isActive: template.isActive,
        variables: template.variables || [],
      });
      
      if (template.variables) {
        setVariables(template.variables);
      }
    } else {
      form.reset({
        name: "",
        description: "",
        type: "welcome",
        subject: "",
        content: "",
        senderName: "",
        senderEmail: "",
        isActive: true,
        variables: [],
      });
      setVariables([]);
    }
  }, [template, form, open]);

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create template");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Success",
        description: "Email template created successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues & { id: number }) => {
      const { id, ...data } = values;
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update template");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    values.variables = variables;
    
    if (template) {
      updateMutation.mutate({ ...values, id: template.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleAddVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable("");
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Email Template" : "Create Email Template"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Welcome Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="password_reset">Password Reset</SelectItem>
                        <SelectItem value="event_registration">Event Registration</SelectItem>
                        <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this email template's purpose"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Name</FormLabel>
                    <FormControl>
                      <Input placeholder="MatchPro Team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Email</FormLabel>
                    <FormControl>
                      <Input placeholder="noreply@matchpro.ai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Welcome to MatchPro!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hello {{name}}, welcome to MatchPro!"
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use variables like {{varName}} in your template.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Template Variables</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add variable (e.g. name, event, date)"
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddVariable} size="sm">
                  Add
                </Button>
              </div>
              {variables.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {variables.map((variable) => (
                    <div
                      key={variable}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                    >
                      {variable}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => handleRemoveVariable(variable)}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Only active templates can be used to send emails.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {template ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
