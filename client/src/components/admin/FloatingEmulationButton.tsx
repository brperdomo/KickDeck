import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export function FloatingEmulationButton() {
  const [emulationToken, setEmulationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmulating, setIsEmulating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for emulation token on mount and window focus
  useEffect(() => {
    const checkEmulationStatus = async () => {
      const token = localStorage.getItem('emulationToken');
      
      // If no token exists, we're definitely not emulating
      if (!token) {
        setEmulationToken(null);
        setIsEmulating(false);
        return;
      }
      
      // Verify if the token is valid by checking emulation status
      try {
        const response = await fetch('/api/admin/emulation/status', {
          headers: {
            'X-Emulation-Token': token
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isEmulating) {
            setEmulationToken(token);
            setIsEmulating(true);
          } else {
            // Token exists but is invalid - clean it up
            localStorage.removeItem('emulationToken');
            setEmulationToken(null);
            setIsEmulating(false);
          }
        } else {
          // Token is invalid - clean it up
          localStorage.removeItem('emulationToken');
          setEmulationToken(null);
          setIsEmulating(false);
        }
      } catch (error) {
        console.error("Error checking emulation status:", error);
        // Don't remove token on network errors to prevent
        // flashing of the UI if there's a temporary network issue
      }
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

      // Always clean up the local storage, even if the API call fails
      localStorage.removeItem('emulationToken');
      setEmulationToken(null);
      setIsEmulating(false);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error stopping emulation:", errorData);
        // Still continue with UI refresh since we want to reset the state regardless
      }

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
        title: 'Emulation Reset',
        description: 'Emulation mode has been reset due to an error',
        variant: 'destructive',
      });
      console.error("Error in emulation stop handler:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show the button if we're actually emulating
  if (!isEmulating) return null;

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