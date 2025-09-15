
export interface EmployeeSkill {
  employee_id: string;
  name: string;
  department: string;
  role: string;
  skill: string;
  skill_level: number;
}

export interface RoleExpectation {
  role: string;
  required_skill: string;
  required_level: number;
}

export interface CalculatedGap {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
  skill: string;
  current_level: number | null; // Null if skill is missing
  required_level: number;
  gap: number | null; // Difference if deficient, or required_level if missing
  gap_type: 'missing' | 'deficient' | 'compliant' | 'exceeds';
}

export interface TrainingRecommendation {
  employee_id: string;
  name: string;
  role: string;
  suggestions: string[];
}

export interface HiringSuggestion {
  role: string;
  hiring_suggestion: string;
  profile_keywords: string[];
}

export interface UpskillingPriority {
  skill: string;
  justification: string;
}

export interface RoleReadinessSummary {
  role: string;
  readiness_summary: string;
}

export interface AISkillAnalysisResults {
  overallSummary?: string;
  trainingRecommendations?: TrainingRecommendation[];
  hiringSuggestions?: HiringSuggestion[];
  upskillingPriorities?: UpskillingPriority[];
  roleReadinessSummaries?: RoleReadinessSummary[];
}

export interface AggregatedSkillData {
  skill: string;
  deficientCount: number;
  missingCount: number;
  averageGap: number;
}

export interface DepartmentSkillGap {
  department: string;
  skill: string;
  gaps: number; // Number of employees with gaps in this skill for this department
}

export enum TabKey {
  UPLOAD = 'upload',
  DASHBOARD = 'dashboard',
  SUGGESTIONS = 'suggestions',
  REPORTS = 'reports',
}
