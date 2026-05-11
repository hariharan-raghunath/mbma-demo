// ============================================================
// MBMA School Configuration
// Add or remove schools here. This is the single source of truth.
// ============================================================

export const SCHOOLS: string[] = [
  "Pine View High School",
  "Greenfield Academy",
  "Sunrise Public School",
  "St. Joseph's Higher Secondary",
  "National Model School",
  "GAFL Bangalore",
];

// Re-export curriculum data for convenience
export { GRADES, SECTIONS, GRADES_CURRICULUM, formatTopic } from "./curriculum";
export type { CurriculumEntry } from "./curriculum";
