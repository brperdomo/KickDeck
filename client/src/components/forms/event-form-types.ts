import { z } from "zod";

export interface EventBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: File;
}

export interface EventData {
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
  applicationDeadline: string;
  details?: string;
  agreement?: string;
  refundPolicy?: string;
  ageGroups: AgeGroup[];
  complexFieldSizes: Record<number, FieldSize>;
  selectedComplexIds: number[];
  scoringRules: ScoringRule[];
  settings: EventSetting[];
  administrators: EventAdministrator[];
  branding?: EventBranding;
}

export interface Complex {
  id: number;
  name: string;
  fields: Field[];
}

export interface Field {
  id: number;
  name: string;
  complexId: number;
  hasLights: boolean;
  hasParking: boolean;
  isOpen: boolean;
}

export interface EventSetting {
  id: string;
  key: string;
  value: string;
}

export interface EventAdministrator {
  id: string;
  userId: number;
  role: 'owner' | 'admin' | 'moderator';
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type Gender = 'Male' | 'Female' | 'Coed';
export type FieldSize = '3v3' | '4v4' | '5v5' | '6v6' | '7v7' | '8v8' | '9v9' | '10v10' | '11v11' | 'N/A';
export type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';

export interface AgeGroup {
  id: string;
  gender: Gender;
  projectedTeams: number;
  birthDateStart: string;
  birthDateEnd: string;
  scoringRule?: string;
  ageGroup: string;
  fieldSize: FieldSize;
  amountDue?: number | null;
}

export interface ScoringRule {
  id: string;
  title: string;
  win: number;
  loss: number;
  tie: number;
  goalCapped: number;
  shutout: number;
  redCard: number;
  tieBreaker: string;
}

export const TAB_ORDER: EventTab[] = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];

export const USA_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

export const eventInformationSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().min(1, "Time zone is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
});

export const ageGroupSchema = z.object({
  gender: z.enum(['Male', 'Female', 'Coed']),
  projectedTeams: z.number().min(0).max(200),
  birthDateStart: z.string().min(1, "Start date is required"),
  birthDateEnd: z.string().min(1, "End date is required"),
  scoringRule: z.string().optional(),
  ageGroup: z.string().min(1, "Age group is required"),
  fieldSize: z.enum(['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A']),
  amountDue: z.number().nullable().optional(),
});

export const scoringRuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  win: z.number().min(0, "Win points must be positive"),
  loss: z.number().min(0, "Loss points must be positive"),
  tie: z.number().min(0, "Tie points must be positive"),
  goalCapped: z.number().min(0, "Goal cap must be positive"),
  shutout: z.number().min(0, "Shutout points must be positive"),
  redCard: z.number().min(-10, "Red card points must be greater than -10"),
  tieBreaker: z.string().min(1, "Tie breaker is required"),
});

export const eventSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

export type EventInformationValues = z.infer<typeof eventInformationSchema>;
export type AgeGroupValues = z.infer<typeof ageGroupSchema>;
export type ScoringRuleValues = z.infer<typeof scoringRuleSchema>;
export type EventSettingValues = z.infer<typeof eventSettingSchema>;

export interface EventFormProps {
  initialData?: EventData;
  onSubmit: (data: EventData) => Promise<void>;
  isEdit?: boolean;
}

export interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminToEdit?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  } | null;
}
