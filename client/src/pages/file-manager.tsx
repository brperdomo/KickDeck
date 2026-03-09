import React from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/hooks/use-user';
import { FileManager } from '@/components/admin/file-manager';
import { Loader2 } from 'lucide-react';

const FileManagerPage: React.FC = () => {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    } else if (!isLoading && user && !user.isAdmin) {
      setLocation('/dashboard');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return <FileManager />;
};

export default FileManagerPage;
