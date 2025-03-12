
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash, Edit, Globe } from "lucide-react";
import { ChromePicker } from "react-color";

interface Organization {
  id: number;
  name: string;
  domain: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function OrganizationsManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'primary' | 'secondary' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    primaryColor: "#000000",
    secondaryColor: "#32CD32",
    logoUrl: "",
  });

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/organizations");
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch organizations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (color: { hex: string }, type: 'primary' | 'secondary') => {
    setFormData((prev) => ({ ...prev, [type === 'primary' ? 'primaryColor' : 'secondaryColor']: color.hex }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const endpoint = editingOrg 
        ? `/api/admin/organizations/${editingOrg.id}` 
        : "/api/admin/organizations";
      
      const method = editingOrg ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingOrg ? 'update' : 'create'} organization`);
      }

      toast({
        title: "Success",
        description: `Organization ${editingOrg ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      fetchOrganizations();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${editingOrg ? 'update' : 'create'} organization`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      domain: org.domain || "",
      primaryColor: org.primaryColor,
      secondaryColor: org.secondaryColor || "#32CD32",
      logoUrl: org.logoUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this organization?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete organization");
      }

      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });

      fetchOrganizations();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete organization",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      domain: "",
      primaryColor: "#000000",
      secondaryColor: "#32CD32",
      logoUrl: "",
    });
    setEditingOrg(null);
    setShowColorPicker(null);
  };

  const addOrganization = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Client Organizations</h2>
        <Button onClick={addOrganization}>
          <Plus className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Client Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-6 text-muted">
              No organizations found. Create your first organization!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Primary Color</TableHead>
                  <TableHead>Secondary Color</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.domain || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="w-6 h-6 rounded mr-2"
                          style={{ backgroundColor: org.primaryColor }}
                        />
                        {org.primaryColor}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="w-6 h-6 rounded mr-2"
                          style={{ backgroundColor: org.secondaryColor }}
                        />
                        {org.secondaryColor}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(org)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(org.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingOrg ? "Edit Organization" : "Add Organization"}</DialogTitle>
            <DialogDescription>
              {editingOrg
                ? "Update the organization details and branding settings."
                : "Add a new client organization with custom branding."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Organization name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right">
                Domain
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  placeholder="client1"
                />
                <div className="text-sm text-muted-foreground whitespace-nowrap">.matchpro.ai</div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="primaryColor" className="text-right">
                Primary Color
              </Label>
              <div className="col-span-3 relative">
                <div className="flex gap-2 items-center">
                  <div
                    className="h-8 w-8 rounded cursor-pointer border"
                    style={{ backgroundColor: formData.primaryColor }}
                    onClick={() => setShowColorPicker(showColorPicker === 'primary' ? null : 'primary')}
                  />
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleInputChange}
                  />
                </div>
                {showColorPicker === 'primary' && (
                  <div className="absolute z-10 mt-2">
                    <ChromePicker
                      color={formData.primaryColor}
                      onChange={(color) => handleColorChange(color, 'primary')}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secondaryColor" className="text-right">
                Secondary Color
              </Label>
              <div className="col-span-3 relative">
                <div className="flex gap-2 items-center">
                  <div
                    className="h-8 w-8 rounded cursor-pointer border"
                    style={{ backgroundColor: formData.secondaryColor }}
                    onClick={() => setShowColorPicker(showColorPicker === 'secondary' ? null : 'secondary')}
                  />
                  <Input
                    id="secondaryColor"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleInputChange}
                  />
                </div>
                {showColorPicker === 'secondary' && (
                  <div className="absolute z-10 mt-2">
                    <ChromePicker
                      color={formData.secondaryColor}
                      onChange={(color) => handleColorChange(color, 'secondary')}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logoUrl" className="text-right">
                Logo URL
              </Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="URL to logo image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingOrg ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
