/**
 * Represents a specific field within a complex
 */
export interface Field {
  id: number;
  name: string;
  fieldType: string;
  fieldSize: string;
  surfaceType: string;
  isOpen: boolean;
  complexId: number;
  createdAt: string;
  updatedAt: string;
  // Additional optional properties
  notes?: string | null;
  maintenanceNotes?: string | null;
  maintenanceSchedule?: string | null;
  maxCapacity?: number | null;
}