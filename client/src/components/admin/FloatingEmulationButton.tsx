import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export function FloatingEmulationButton() {
  const [emulationToken, setEmulationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for emulation token on mount and window focus
  useEffect(() => {
    const checkEmulationStatus = () => {
      const token = localStorage.getItem('emulationToken');
      setEmulationToken(token);
    };

    // Check on mount
    checkEmulationStatus();

    // Check on window focus
    window.addEventListener('focus', checkEmulationStatus);
    return () => {
      window.removeEventListener('focus', checkEmulationStatus);
    };
  }, []);

  const handleStopEmulation = async () => {
    if (!emulationToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/emulation/stop/${emulationToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to stop emulation');
      }

      // Remove token from local storage
      localStorage.removeItem('emulationToken');
      setEmulationToken(null);

      // Refresh all queries
      queryClient.invalidateQueries();
      
      // Force refresh the user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });

      // Reload the page to ensure UI updates properly
      window.location.reload();

      toast({
        title: 'Emulation Stopped',
        description: 'You are now viewing the system as yourself',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred stopping emulation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!emulationToken) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        onClick={handleStopEmulation}
        size="lg"
        className="shadow-lg bg-red-600 hover:bg-red-700 text-white"
        disabled={isLoading}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isLoading ? 'Exiting...' : 'Exit Emulation Mode'}
      </Button>
    </div>
  );
}