import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, Users } from 'lucide-react';
import EmulationManager from './EmulationManager';
import { useQuery } from '@tanstack/react-query';

interface EmulationStatus {
  emulating: boolean;
  token?: string;
  emulatedAdmin?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function FloatingEmulationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [emulationToken, setEmulationToken] = useState<string | null>(null);
  
  // Check current emulation status
  const { data: statusData } = useQuery({
    queryKey: ['emulation-status'],
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (emulationToken) {
        headers['x-emulation-token'] = emulationToken;
      }
      
      const response = await fetch('/api/admin/emulation/status', { headers });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch emulation status');
      }
      return response.json() as Promise<EmulationStatus>;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Check if there's a saved emulation token in localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('emulationToken');
    if (savedToken) {
      setEmulationToken(savedToken);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 rounded-full shadow-lg z-50"
          size="icon"
          variant={statusData?.emulating ? "default" : "secondary"}
        >
          {statusData?.emulating ? <UserCheck className="h-5 w-5" /> : <Users className="h-5 w-5" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <EmulationManager />
      </DialogContent>
    </Dialog>
  );
}