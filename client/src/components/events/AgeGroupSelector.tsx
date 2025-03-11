import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AgeGroup {
  id: number;
  ageGroup: string;
  birthYear: number;
  gender: string;
  divisionCode: string;
}

interface AgeGroupSelectorProps {
  selectedScopeId: number;
  selectedAgeGroups: number[];
  onAgeGroupsChange: (selectedIds: number[]) => void;
  readOnly?: boolean;
}

export function AgeGroupSelector({ 
  selectedScopeId, 
  selectedAgeGroups, 
  onAgeGroupsChange,
  readOnly = false
}: AgeGroupSelectorProps) {
  const [filteredAgeGroups, setFilteredAgeGroups] = useState<AgeGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ageGroups, isLoading, error } = useQuery({
    queryKey: [`/api/admin/seasonal-scopes/${selectedScopeId}/age-groups`],
    queryFn: async () => {
      console.log(`Fetching age groups for scope ${selectedScopeId}`);
      const response = await fetch(`/api/admin/seasonal-scopes/${selectedScopeId}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      const data = await response.json();
      console.log('Fetched age groups:', data);
      return data as AgeGroup[];
    },
    enabled: !!selectedScopeId,
  });

  useEffect(() => {
    if (ageGroups) {
      // Filter age groups based on search term
      const filtered = searchTerm
        ? ageGroups.filter(
            (group) =>
              group.ageGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
              group.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
              group.divisionCode.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : ageGroups;

      setFilteredAgeGroups(filtered);
    }
  }, [ageGroups, searchTerm]);

  const handleToggleAgeGroup = (ageGroupId: number) => {
    if (readOnly) return;

    const newSelectedIds = selectedAgeGroups.includes(ageGroupId)
      ? selectedAgeGroups.filter(id => id !== ageGroupId)
      : [...selectedAgeGroups, ageGroupId];

    onAgeGroupsChange(newSelectedIds);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading age groups...</div>;
  }

  if (error) {
    return <div className="text-destructive py-4">Error loading age groups</div>;
  }

  if (!ageGroups || ageGroups.length === 0) {
    return <div className="text-center py-4">No age groups available for this seasonal scope</div>;
  }

  return (
    <Card>
      <CardContent className="pt-4">
        {!readOnly && (
          <div className="mb-4">
            <Input
              placeholder="Search age groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        )}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {filteredAgeGroups.map((ageGroup) => (
            <div
              key={ageGroup.id}
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
              onClick={() => handleToggleAgeGroup(ageGroup.id)}
            >
              <Checkbox
                id={`age-group-${ageGroup.id}`}
                checked={selectedAgeGroups.includes(ageGroup.id)}
                onCheckedChange={() => handleToggleAgeGroup(ageGroup.id)}
                disabled={readOnly}
              />
              <Label
                htmlFor={`age-group-${ageGroup.id}`}
                className="font-normal cursor-pointer flex-1"
              >
                <div className="flex justify-between">
                  <span>
                    {ageGroup.ageGroup} {ageGroup.gender === 'Boys' ? '(M)' : '(F)'}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {ageGroup.divisionCode}
                  </span>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}