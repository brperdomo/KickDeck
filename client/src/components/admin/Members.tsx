import React from 'react';
import { Shield } from 'lucide-react';
import MemberDetails from './MemberDetails';
import { PermissionGuard } from './PermissionGuard';

/**
 * Members Component
 * 
 * Uses the PermissionGuard component to handle permission checks and loading states
 * Shows a friendly message if the user doesn't have access
 */
const Members: React.FC = () => {
  return (
    <PermissionGuard 
      permission="view_members"
      fallback={
        <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have permission to view member information. Please contact an administrator if you believe you should have access.
          </p>
        </div>
      }
    >
      <MemberDetails />
    </PermissionGuard>
  );
};

export default Members;