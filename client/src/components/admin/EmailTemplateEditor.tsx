
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const emailSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Trigger type is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Invalid email address"),
  isDefault: z.boolean().default(false)
});

type EmailFormData = z.infer<typeof emailSchema>;

const EMAIL_TRIGGERS = [
  { value: "registration_confirmation", label: "Registration Confirmation" },
  { value: "payment_receipt", label: "Payment Receipt" },
  { value: "password_reset", label: "Password Reset" },
  { value: "account_verification", label: "Account Verification" },
  { value: "event_reminder", label: "Event Reminder" },
  { value: "schedule_update", label: "Schedule Update" },
  { value: "team_invitation", label: "Team Invitation" },
  { value: "welcome", label: "Welcome Email" }
];

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: Omit<EmailTemplate, 'id'>) => Promise<void>;
  onPreview?: (template: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

export function EmailTemplateEditor({ template, onSave, onPreview, onCancel }: EmailTemplateEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      name: template?.name || "",
      type: template?.type || "",
      subject: template?.subject || "",
      content: template?.content || "",
      senderName: template?.senderName || "",
      senderEmail: template?.senderEmail || "",
      isDefault: template?.isDefault || false
    }
  });

  const handleSubmit = async (data: EmailFormData) => {
    try {
      setIsSaving(true);
      await onSave(data);
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      setIsPreviewing(true);
      const data = form.getValues();
      onPreview(data)
        .catch(error => console.error("Error previewing template:", error))
        .finally(() => setIsPreviewing(false));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Welcome Email" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trigger Type</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select when this email sends" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TRIGGERS.map(trigger => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Line</FormLabel>
              <FormControl>
                <Input placeholder="Email subject line" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="senderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sender Name</FormLabel>
                <FormControl>
                  <Input placeholder="MatchPro" {...field} />
                </FormControl>
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
                  <Input placeholder="noreply@example.com" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter email content here. You can use HTML and template variables like {{name}}, {{event}}, etc."
                  className="min-h-[200px]" 
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Set as Default</FormLabel>
                <div className="text-sm text-muted-foreground">
                  This will be the default template for this trigger type
                </div>
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

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="space-x-2">
            {onPreview && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handlePreview}
                disabled={isPreviewing}
              >
                {isPreviewing ? "Previewing..." : "Preview"}
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
