import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function FileManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">File Manager</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No files available</p>
      </Card>
    </div>
  );
}
