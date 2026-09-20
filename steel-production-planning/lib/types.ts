export const PACKAGE_TYPES = ["Structural Steel Erection Package", "Miscellaneous Metals Package"] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const FIELD_SOURCES = ["Rule", "AI", "Human"] as const;
export type FieldSource = (typeof FIELD_SOURCES)[number];

// The exception taxonomy — four types, matching the brief exactly.
export const FIELD_STATUSES = ["Populated", "Missing", "Conflict", "Low Confidence", "Incomplete"] as const;
export type FieldStatus = (typeof FIELD_STATUSES)[number];

export const PACKAGE_STATUSES = ["Draft Generated", "Needs Review", "Approved", "Released"] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export interface RequirementItem {
  id: string;
  name: string;
  required: boolean;
  sourceSystem: string;
  status: FieldStatus;
  source: FieldSource;
  confidence: number;
  value?: string;
  conflictValues?: [string, string];
  note?: string;
}

export interface PackageEvent {
  timestamp: string;
  event: string;
  actor: string;
}

export interface PackageInstance {
  id: string;
  project: string;
  job: string;
  phase: string;
  release: string;
  packageType: PackageType;
  status: PackageStatus;
  planner: string;
  requestedAt: string;
  requiredByDate: string;
  releasedAt: string | null;
  effortHours: number;
  correctionsCount: number;
  downstreamIssues: number;
  firstPassComplete: boolean;
  originalExceptionCount: number;
  requirements: RequirementItem[];
  history: PackageEvent[];
}
