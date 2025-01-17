import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { SelectUser } from "@db/schema";
import {
  Calendar,
  Search,
  Plus,
  Settings,
  Users,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash,
  Copy,
  Eye,
  Shield,
  UserPlus,
  Home,
  LogOut,
  FileText,
  User,
  Palette,
  ChevronRight,
  Loader2,
  CreditCard,
  Download,
  ClipboardList,
  UserCircle,
  Percent,
  Printer,
  Flag,
  MoreHorizontal,
  Building2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { BrandingPreviewProvider, useBrandingPreview } from "@/hooks/use-branding-preview";
import { useExportProcess } from "@/hooks/use-export-process";
import { lazy, Suspense } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch"; // Added import

const MyAccount = lazy(() => import("./my-account"));

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

type View = 'events' | 'teams' | 'administrators' | 'settings' | 'households' | 'reports' | 'account' | 'complexes' | 'scheduling';
type SettingsView = 'branding' | 'general' | 'payments';
type ReportType = 'financial' | 'manager' | 'player' | 'schedule' | 'guest-player';

function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('financial');
  const { isExporting, startExport } = useExportProcess();

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'financial':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Event Financial Reports</h3>
              <Button
                onClick={() => startExport('financial')}
                disabled={isExporting !== null}
              >
                {isExporting === 'financial' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Export Report
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Financial report content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'manager':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manager Export</h3>
              <Button
                onClick={() => startExport('manager')}
                disabled={isExporting !== null}
              >
                {isExporting === 'manager' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Manager export content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'player':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Player Export</h3>
              <Button
                onClick={() => startExport('player')}
                disabled={isExporting !== null}
              >
                {isExporting === 'player' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Player export content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Schedule Export</h3>
              <Button
                onClick={() => startExport('schedule')}
                disabled={isExporting !== null}
              >
                {isExporting === 'schedule' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Schedule export content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'guest-player':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Guest Player Export</h3>
              <Button
                onClick={() => startExport('guest-player')}
                disabled={isExporting !== null}
              >
                {isExporting === 'guest-player' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Guest player export content will be implemented here</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Report Navigation */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              <Button
                variant={selectedReport === 'financial' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('financial')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Event Financial Reports
                {isExporting === 'financial' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
              <Button
                variant={selectedReport === 'manager' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('manager')}
                disabled={isExporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                Manager Export
                {isExporting === 'manager' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
              <Button
                variant={selectedReport === 'player' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('player')}
                disabled={isExporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                Player Export
                {isExporting === 'player' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
              <Button
                variant={selectedReport === 'schedule' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('schedule')}
                disabled={isExporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                Schedule Export
                {isExporting === 'schedule' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
              <Button
                variant={selectedReport === 'guest-player' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('guest-player')}
                disabled={isExporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                Guest Player Export
                {isExporting === 'guest-player' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <div className="col-span-3">
          <Card>
            <CardContent className="p-6">
              {renderReportContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function BrandingPreview() {
  const { preview } = useBrandingPreview();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Logo Preview */}
          {preview.logoUrl && (
            <div className="flex justify-center p-4 bg-background rounded-lg">
              <img
                src={preview.logoUrl}
                alt="Organization logo"
                className="h-20 w-20 object-contain"
              />
            </div>
          )}

          {/* Organization Name Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Organization Name</h3>
            <div className="p-4 rounded-lg bg-card">
              <span
                className="text-xl font-bold"
                style={{ color: preview.primaryColor }}
              >
                {preview.name || "Your Organization Name"}
              </span>
            </div>
          </div>

          {/* Color Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Brand Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg flex flex-col items-center justify-center">
                <span
                  className="text-white text-sm font-medium"
                  style={{ backgroundColor: preview.primaryColor }}
                >
                  Primary
                </span>
              </div>
              <div className="p-4 rounded-lg flex flex-col items-center justify-center border">
                <span
                  className="text-sm font-medium"
                  style={{ backgroundColor: preview.secondaryColor }}
                >
                  Secondary
                </span>
              </div>
            </div>
          </div>

          {/* Sample UI Elements */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Sample Elements</h3>
            <div className="space-y-2">
              <Button
                className="w-full"
                style={{
                  backgroundColor: preview.primaryColor,
                  color: 'white',
                }}
              >
                Sample Button
              </Button>
              <div className="p-4 rounded-lg">
                <p
                  className="text-sm"
                  style={{
                    backgroundColor: preview.secondaryColor,
                    color: preview.primaryColor
                  }}
                >
                  Sample text with your brand colors
                </p>
              </div>
            </div>
          </div>
        </div>

        {preview.isDraft && (
          <p className="text-sm text-muted-foreground italic text-center">
            * Preview mode - changes are not saved
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OrganizationSettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useOrganizationSettings();
  const { updatePreview } = useBrandingPreview();
  const [name, setName] = useState(settings?.name || '');
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondaryColor || '#ffffff');
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(settings?.logoUrl);

  useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setPrimaryColor(settings.primaryColor || '#000000');
      setSecondaryColor(settings.secondaryColor || '#ffffff');
      setPreviewUrl(settings.logoUrl);
    }
  }, [settings]);

  // Update preview whenever form values change
  useEffect(() => {
    updatePreview({
      name,
      primaryColor,
      secondaryColor,
      logoUrl: previewUrl,
      isDraft: true,
    });
  }, [name, primaryColor, secondaryColor, previewUrl, updatePreview]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogo(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      updatePreview({ logoUrl: url });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        name,
        primaryColor,
        secondaryColor,
        logoUrl: previewUrl,
      });
      updatePreview({ isDraft: false });
    } catch (error) {
      console.error('Error updating organization settings:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Organization Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#000000"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#ffffff"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Organization Logo</Label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    onChange={handleLogoChange}
                    accept="image/*"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recommended size: 200x200px. Max file size: 2MB
                  </p>
                </div>
                {previewUrl && (
                  <div className="relative w-20 h-20 border rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <BrandingPreview />
    </div>
  );
}

function PaymentsSettingsView() {
  const [stripeAccount, setStripeAccount] = useState({
    businessName: '',
    displayName: '',
    accountStatus: 'Not Connected',
    bankAccountLast4: '',
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payment Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Business Name</Label>
              <p className="text-lg font-medium">{stripeAccount.businessName || 'Not set'}</p>
            </div>
            <div>
              <Label>Display Name</Label>
              <p className="text-lg font-medium">{stripeAccount.displayName || 'Not set'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Account Status</Label>
              <Badge variant={stripeAccount.accountStatus === 'Active' ? 'default' : 'secondary'}>
                {stripeAccount.accountStatus}
              </Badge>
            </div>
            <div>
              <Label>Bank Account</Label>
              <p className="text-lg font-medium">
                {stripeAccount.bankAccountLast4
                  ? `****${stripeAccount.bankAccountLast4}`
                  : 'Not connected'}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline">
              Disconnect
            </Button>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Connect with Stripe
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ComplexesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isViewFieldsModalOpen, setIsViewFieldsModalOpen] = useState(false);
  const [selectedComplexId, setSelectedComplexId] = useState<number | null>(null);
  const [selectedComplex, setSelectedComplex] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    openTime: '',
    closeTime: '',
    address: '',
    city: '',
    state: '',
    country: 'US',
    rules: '',
    directions: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    openTime: '',
    closeTime: '',
    address: '',
    city: '',
    state: '',
    country: 'US',
    rules: '',
    directions: ''
  });
  const [fieldFormData, setFieldFormData] = useState({
    name: '',
    hasLights: false,
    hasParking: false,
    specialInstructions: ''
  });

  // Query for complexes data
  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json();
    }
  });

  // Query for complex analytics
  const analyticsQuery = useQuery({
    queryKey: ['/api/admin/complexes/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Add create complex mutation
  const createComplexMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/admin/complexes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create complex');
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      analyticsQuery.refetch();
      setIsModalOpen(false);
      setFormData({
        name: '',
        openTime: '',
        closeTime: '',
        address: '',
        city: '',
        state: '',
        country: 'US',
        rules: '',
        directions: ''
      });
    }
  });

  // Add update complex mutation
  const updateComplexMutation = useMutation({
    mutationFn: async (data: typeof editFormData & { id: number }) => {
      const response = await fetch(`/api/admin/complexes/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update complex');
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      analyticsQuery.refetch();
      setIsEditModalOpen(false);
      setEditFormData({
        name: '',
        openTime: '',
        closeTime: '',
        address: '',
        city: '',
        state: '',
        country: 'US',
        rules: '',
        directions: ''
      });
    }
  });

  // Add field creation mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: typeof fieldFormData & { complexId: number }) => {
      const response = await fetch('/api/admin/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create field');
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      fieldsQuery.refetch();
      setIsFieldModalOpen(false);
      setFieldFormData({
        name: '',
        hasLights: false,
        hasParking: false,
        specialInstructions: ''
      });
    }
  });

  // Add delete complex mutation
  const deleteComplexMutation = useMutation({
    mutationFn: async (complexId: number) => {
      const response = await fetch(`/api/admin/complexes/${complexId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete complex');
      return response.json();
    },
    onSuccess: () => {
      complexesQuery.refetch();
      analyticsQuery.refetch();
    }
  });

  // Add field deletion mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await fetch(`/api/admin/fields/${fieldId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete field');
      return response.json();
    },
    onSuccess: () => {
      fieldsQuery.refetch();
    }
  });

  // Add field status toggle mutation
  const toggleFieldStatusMutation = useMutation({
    mutationFn: async ({ fieldId, isOpen }: { fieldId: number, isOpen: boolean }) => {
      const response = await fetch(`/api/admin/fields/${fieldId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen })
      });
      if (!response.ok) throw new Error('Failed to update field status');
      return response.json();
    },
    onSuccess: () => {
      fieldsQuery.refetch();
    }
  });

  // Add query for fetching fields
  const fieldsQuery = useQuery({
    queryKey: ['/api/admin/complexes', selectedComplexId, 'fields'],
    queryFn: async () => {
      if (!selectedComplexId) return null;
      const response = await fetch(`/api/admin/complexes/${selectedComplexId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
    enabled: !!selectedComplexId && isViewFieldsModalOpen
  });

  const handleEditComplex = (complex: any) => {
    setSelectedComplexId(complex.id);
    setEditFormData({
      name: complex.name,
      openTime: complex.openTime,
      closeTime: complex.closeTime,
      address: complex.address,
      city: complex.city,
      state: complex.state,
      country: complex.country || 'US',
      rules: complex.rules || '',
      directions: complex.directions || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplexId) return;

    updateComplexMutation.mutate({
      ...editFormData,
      id: selectedComplexId
    });
  };

  const handleFieldModalOpen = (complexId: number) => {
    setSelectedComplexId(complexId);
    setIsFieldModalOpen(true);
  };

  const handleViewFields = (complex: any) => {
    setSelectedComplexId(complex.id);
    setSelectedComplex(complex);
    setIsViewFieldsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createComplexMutation.mutate(formData);
  };

  const handleFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplexId) return;

    createFieldMutation.mutate({
      ...fieldFormData,
      complexId: selectedComplexId
    });
  };

  const renderEditModal = () => (
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Complex</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEditSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Complex Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter complex name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Select
                  value={editFormData.country}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter street address"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-open-time">Opening Time</Label>
                <Input
                  id="edit-open-time"
                  type="time"
                  value={editFormData.openTime}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, openTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-close-time">Closing Time</Label>
                <Input
                  id="edit-close-time"
                  type="time"
                  value={editFormData.closeTime}
                  onChange={(e) => setEditFormData(prev =>({ ...prev, closeTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rules">Rules (Optional)</Label>
              <Textarea
                id="edit-rules"
                value={editFormData.rules}
                onChange={(e) => setEditFormData(prev => ({ ...prev, rules: e.target.value }))}
                placeholder="Enter complex rules"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-directions">Directions (Optional)</Label>
              <Textarea
                id="edit-directions"
                value={editFormData.directions}
                onChange={(e) => setEditFormData(prev => ({ ...prev, directions: e.target.value }))}
                placeholder="Enter directions to complex"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={updateComplexMutation.isPending}>
              {updateComplexMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderActionButtons = (complex: any) => (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEditComplex(complex)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit complex information</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleFieldModalOpen(complex.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add new field</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => handleViewFields(complex)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View fields in this complex</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this complex? This will also delete all fields associated with it.')) {
                deleteComplexMutation.mutate(complex.id);
              }
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete this complex</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Field Complexes</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Complex
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complexes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsQuery.data?.totalComplexes || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsQuery.data?.message || "Add your first complex to get started"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Complex List */}
      <Card>
        <CardContent className="p-0">
          {complexesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : complexesQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No complexes found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first complex
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-center">Fields Status</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complexesQuery.data?.map((complex: any) => (
                  <TableRow key={complex.id}>
                    <TableCell className="font-medium">
                      {complex.name}
                    </TableCell>
                    <TableCell>
                      {complex.address}, {complex.city}, {complex.state}
                    </TableCell>
                    <TableCell>
                      {complex.openTime} - {complex.closeTime}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-4">
                        <Badge variant="secondary">
                          {complex.openFields} Open
                        </Badge>
                        <Badge variant="outline" className="text-red-500">
                          {complex.closedFields} Closed
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderActionButtons(complex)}
                    </TableCell>
                  </TableRow>
                ))}
                {!complexesQuery.data?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No complexes found. Add your first complex to get started!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {renderEditModal()}
    </>
  );
}

export default ComplexesView;

function SchedulingView() {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Scheduling</h2>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Schedule Management</h3>
            <p className="text-muted-foreground">
              Manage game schedules, field assignments, and time slots
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function AdminDashboard() {
  const { user, logout } = useUser();
  const [, navigate] = useLocation();
  const [currentView, setCurrentView] = useState<View>('events');
  const [currentSettingsView, setCurrentSettingsView] = useState<SettingsView>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { currentColor, setColor, isLoading: isThemeLoading } = useTheme();

  useEffect(() => {
    if (!isAdminUser(user)) {
      navigate("/");
    }
  }, [user, navigate]);

  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["/api/admin/events"],
    enabled: isAdminUser(user) && currentView === 'events',
    staleTime: 30000,
    gcTime: 3600000,
  });

  const { data: administrators, isLoading: adminsLoading, error: adminsError } = useQuery<SelectUser[]>({
    queryKey: ["/api/admin/administrators"],
    enabled: isAdminUser(user) && currentView === 'administrators',
    staleTime: 30000,
    gcTime: 3600000,
  });

  const { data: households, isLoading: householdsLoading, error: householdsError } = useQuery<any[]>({
    queryKey: ["/api/admin/households"],
    enabled: isAdminUser(user) && currentView === 'households',
    staleTime: 30000,
    gcTime: 3600000,
  });


  const renderContent = () => {
    switch (currentView) {
      case 'complexes':
        return <ComplexesView />;
      case 'households':
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search households..."
                  className="pl-9 w-[300px]"
                />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Household
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Households</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {householdsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : householdsError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Failed to load households
                          </TableCell>
                        </TableRow>
                      ) : households?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No households found
                          </TableCell>
                        </TableRow>
                      ) : (
                        households?.map((household) => (
                          <TableRow key={household.id}>
                            <TableCell>{household.name}</TableCell>
                            <TableCell>{household.address}</TableCell>
                            <TableCell>{household.phone}</TableCell>
                            <TableCell>{household.email}</TableCell>
                            <TableCell>
                              <Badge variant={household.status === 'active' ? 'default' : 'secondary'}>
                                {household.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        );

      case 'administrators':
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Administrators</h2>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Administrator User
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Full Admin Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : adminsError ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-destructive">
                            Error loading administrators: {adminsError instanceof Error ? adminsError.message : 'Unknown error'}
                          </TableCell>
                        </TableRow>
                      ) : !administrators || administrators.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No administrators found
                          </TableCell>
                        </TableRow>
                      ) : (
                        administrators.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell>{admin.firstName} {admin.lastName}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </TableCell>
                            <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        );

      case 'events':
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="pl-9 w-[300px]"
                />
              </div>
              <Button onClick={() => navigate("/create-event")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Date
                            <div className="flex flex-col">
                              <ChevronUp className="h-3 w-3" />
                              <ChevronDown className="h-3 w-3" />
                            </div>
                          </div>
                        </TableHead>
                        <TableHead># of Applications</TableHead>
                        <TableHead># of Accepted Teams</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : eventsError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-destructive">
                            Error loading events: {eventsError instanceof Error ? eventsError.message : 'Unknown error'}
                          </TableCell>
                        </TableRow>
                      ) : !events || events.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No events found
                          </TableCell>
                        </TableRow>
                      ) : (
                        events.map((event: any) => (
                          <TableRow key={event.id}>
                            <TableCell>{event.name}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>{event.applicationCount || 0}</TableCell>
                            <TableCell>{event.acceptedTeamsCount || 0}</TableCell>
                            <TableCell>
                              <Badge variant={event.status === 'Active' ? 'default' : 'secondary'}>
                                {event.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Manage
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <ClipboardList className="mr-2 h-4 w-4" />
                                      Application Questions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <UserCircle className="mr-2 h-4 w-4" />
                                      Player Questions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Percent className="mr-2 h-4 w-4" />
                                      Discounts
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Printer className="mr-2 h-4 w-4" />
                                      Print Game Cards
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Flag className="mr-2 h-4 w-4" />
                                      Red Card Report
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete Event
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        );

      case 'settings':
        if (currentSettingsView === 'branding') {
          return (
            <BrandingPreviewProvider>
              <OrganizationSettingsForm />
            </BrandingPreviewProvider>
          );
        }

        if (currentSettingsView === 'payments') {
          return <PaymentsSettingsView />;
        }

        return null;
      case 'reports':
        return <ReportsView />;
      case 'account':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <MyAccount />
          </Suspense>
        );
      case 'complexes':
        return <ComplexesView />;
      case 'scheduling':
        return <SchedulingView />;
      default:
        return null;
    }
  };

  if (!isAdminUser(user)) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col h-full">
        <div className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-xl">Admin Dashboard</h1>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <Button
              variant={currentView === 'events' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('events')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </Button>

            <Button
              variant={currentView === 'households' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('households')}
            >
              <Home className="mr-2 h-4 w-4" />
              Households
            </Button>

            <Button
              variant={currentView === 'administrators' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('administrators')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Administrators
            </Button>

            <Button
              variant={currentView === 'reports' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button
              variant={currentView === 'complexes' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('complexes')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Field Complexes
            </Button>
            <Button
                variant={currentView === 'scheduling' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setCurrentView('scheduling')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Scheduling
              </Button>
            <Collapsible
              open={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              className="space-y-2"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={currentView === 'settings' ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                >
                  <span className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isSettingsOpen ? 'rotate-90' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pl-4">
                <Button
                  variant={currentSettingsView === 'branding' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentView('settings');
                    setCurrentSettingsView('branding');
                  }}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Branding
                </Button>
                <Button
                  variant={currentSettingsView === 'payments' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentView('settings');
                    setCurrentSettingsView('payments');
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payments
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Button
              variant={currentView === 'account' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('account')}
            >
              <User className="mr-2 h-4 w-4" />
              My Account
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-auto space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-4 border-t">
              Powered by MatchPro
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {renderContent()}
      </div>
    </div>
  );
}

export default AdminDashboard;