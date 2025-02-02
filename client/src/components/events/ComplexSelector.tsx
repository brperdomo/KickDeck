import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
}

interface ComplexSelectorProps {
  selectedComplexes: number[];
  onComplexSelect: (complexIds: number[]) => void;
}

export function ComplexSelector({ selectedComplexes, onComplexSelect }: ComplexSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: complexes = [], isLoading } = useQuery({
    queryKey: ['/api/admin/complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json();
    }
  });

  const handleToggleComplex = (complexId: number) => {
    const newSelection = selectedComplexes.includes(complexId)
      ? selectedComplexes.filter(id => id !== complexId)
      : [...selectedComplexes, complexId];
    onComplexSelect(newSelection);
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {selectedComplexes.length === 0
              ? "Select complexes..."
              : `${selectedComplexes.length} complex${selectedComplexes.length === 1 ? '' : 'es'} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search complexes..." />
            <CommandEmpty>No complexes found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[200px]">
                {complexes.map((complex: Complex) => (
                  <CommandItem
                    key={complex.id}
                    value={complex.name}
                    onSelect={() => handleToggleComplex(complex.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedComplexes.includes(complex.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{complex.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {complex.address}, {complex.city}, {complex.state}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedComplexes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {complexes
            .filter((complex: Complex) => selectedComplexes.includes(complex.id))
            .map((complex: Complex) => (
              <Badge
                key={complex.id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleToggleComplex(complex.id)}
              >
                {complex.name}
                <span className="ml-1 text-muted-foreground">×</span>
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}
