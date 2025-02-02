import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Update {
  id: number;
  content: string;
  createdAt: string;
}

interface UpdatesLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdatesLogModal({ open, onOpenChange }: UpdatesLogModalProps) {
  const { data: updates = [] } = useQuery({
    queryKey: ['/api/admin/updates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/updates');
      if (!response.ok) throw new Error('Failed to fetch updates');
      return response.json();
    }
  });

  // Group updates by date
  const groupedUpdates = updates.reduce((groups: Record<string, Update[]>, update: Update) => {
    const date = format(new Date(update.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(update);
    return groups;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Updates Log</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedUpdates).map(([date, dayUpdates]) => (
              <div key={date} className="space-y-2">
                <h3 className="font-semibold text-lg sticky top-0 bg-background py-2">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </h3>
                <div className="space-y-3 pl-4">
                  {dayUpdates.map((update) => (
                    <div key={update.id} className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(update.createdAt), 'h:mm a')}
                      </div>
                      <p className="text-sm">{update.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
