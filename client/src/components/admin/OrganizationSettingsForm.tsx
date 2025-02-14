import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from 'react-dropzone';
import { ImageIcon, Loader2 } from "lucide-react";
import { useBrandingPreview } from "@/hooks/use-branding-preview";
import { Card } from "@/components/ui/card";
import { useState, useCallback, useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
});

type FormValues = z.infer<typeof formSchema>;

export function OrganizationSettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useOrganizationSettings();
  const { updatePreview } = useBrandingPreview();
  const { toast } = useToast();
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(settings?.logoUrl);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: settings?.name || "",
      primaryColor: settings?.primaryColor || "#000000",
      secondaryColor: settings?.secondaryColor || "#ffffff",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor || "#ffffff",
      });
      setPreviewUrl(settings.logoUrl || undefined);
      updatePreview({
        name: settings.name,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        logoUrl: settings.logoUrl,
      });
    }
  }, [settings, form, updatePreview]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Preview the uploaded image
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLogo(file);

    try {
      const Vibrant = (await import('node-vibrant')).default;
      const v = new Vibrant(objectUrl);
      const palette = await v.getPalette();

      if (palette.Vibrant) {
        form.setValue('primaryColor', palette.Vibrant.hex);
      }

      if (palette.LightVibrant) {
        form.setValue('secondaryColor', palette.LightVibrant.hex);
      } else if (palette.Muted) {
        form.setValue('secondaryColor', palette.Muted.hex);
      }

      // Update preview
      updatePreview({
        logoUrl: objectUrl,
        primaryColor: palette.Vibrant?.hex || form.getValues('primaryColor'),
        secondaryColor: palette.LightVibrant?.hex || palette.Muted?.hex || form.getValues('secondaryColor'),
      });

      toast({
        title: "Colors extracted",
        description: "Brand colors have been updated based on your logo.",
      });
    } catch (error) {
      console.error('Color extraction error:', error);
      toast({
        title: "Error",
        description: "Failed to extract colors from the logo. Please try a different image.",
        variant: "destructive",
      });
    }
  }, [form, updatePreview, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1,
    multiple: false
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('primaryColor', data.primaryColor);
      formData.append('secondaryColor', data.secondaryColor);
      if (logo) {
        formData.append('logo', logo);
      }

      await updateSettings(formData);

      toast({
        title: "Success",
        description: "Organization settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter organization name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Organization logo"
                  className="h-20 w-20 object-contain"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground text-center">
                {isDragActive
                  ? "Drop the logo here"
                  : "Drag & drop your logo here, or click to select"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Color</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="color"
                        {...field}
                        className="w-12 h-12 p-1"
                        onChange={(e) => {
                          field.onChange(e);
                          updatePreview({ primaryColor: e.target.value });
                        }}
                      />
                    </FormControl>
                    <FormControl>
                      <Input
                        {...field}
                        className="font-mono"
                        onChange={(e) => {
                          field.onChange(e);
                          updatePreview({ primaryColor: e.target.value });
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Color</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="color"
                        {...field}
                        className="w-12 h-12 p-1"
                        onChange={(e) => {
                          field.onChange(e);
                          updatePreview({ secondaryColor: e.target.value });
                        }}
                      />
                    </FormControl>
                    <FormControl>
                      <Input
                        {...field}
                        className="font-mono"
                        onChange={(e) => {
                          field.onChange(e);
                          updatePreview({ secondaryColor: e.target.value });
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}