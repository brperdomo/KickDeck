import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermissions {
  roleId: string;
  permissions: string[];
}

const availablePermissions: Permission[] = [
  // Event Management
  {
    id: "manage_events",
    name: "Manage Events",
    description: "Create, edit, and delete events",
    category: "Events",
  },
  {
    id: "view_events",
    name: "View Events",
    description: "View event details and schedules",
    category: "Events",
  },
  // Team Management
  {
    id: "manage_teams",
    name: "Manage Teams",
    description: "Create, edit, and delete teams",
    category: "Teams",
  },
  {
    id: "view_teams",
    name: "View Teams",
    description: "View team details and rosters",
    category: "Teams",
  },
  // Score Management
  {
    id: "manage_scores",
    name: "Manage Scores",
    description: "Enter and edit match scores",
    category: "Scoring",
  },
  {
    id: "view_scores",
    name: "View Scores",
    description: "View match scores and statistics",
    category: "Scoring",
  },
  // Financial Management
  {
    id: "manage_payments",
    name: "Manage Payments",
    description: "Process payments and refunds",
    category: "Finance",
  },
  {
    id: "view_financial_reports",
    name: "View Financial Reports",
    description: "Access financial reports and analytics",
    category: "Finance",
  },
];

const roles = [
  {
    id: "tournament_admin",
    name: "Tournament Admin",
    description: "Manages tournaments and events",
  },
  {
    id: "score_admin",
    name: "Score Admin",
    description: "Manages scores and results",
  },
  {
    id: "finance_admin",
    name: "Finance Admin",
    description: "Manages financial aspects",
  },
];

export function RolesSettingsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>(roles[0].id);

  // Fetch current role permissions
  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ['/api/admin/role-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/role-permissions');
      if (!response.ok) throw new Error('Failed to fetch role permissions');
      return response.json();
    },
  });

  // Update role permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: RolePermissions) => {
      const response = await fetch(`/api/admin/role-permissions/${data.roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update permissions');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/role-permissions'] });
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const handlePermissionToggle = async (permissionId: string) => {
    const currentPermissions = rolePermissions?.[selectedRole] || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(id => id !== permissionId)
      : [...currentPermissions, permissionId];

    await updatePermissionsMutation.mutateAsync({
      roleId: selectedRole,
      permissions: newPermissions,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        {roles.map((role) => (
          <Button
            key={role.id}
            variant={selectedRole === role.id ? "secondary" : "outline"}
            onClick={() => setSelectedRole(role.id)}
            className="flex items-center"
          >
            <Shield className="mr-2 h-4 w-4" />
            {role.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-6">
        {Object.entries(groupedPermissions).map(([category, permissions]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {category}
                <Badge variant="secondary">
                  {
                    permissions.filter(p => 
                      rolePermissions?.[selectedRole]?.includes(p.id)
                    ).length
                  }/{permissions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <h4 className="text-sm font-medium">{permission.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                    <Switch
                      checked={rolePermissions?.[selectedRole]?.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                      disabled={updatePermissionsMutation.isPending}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
