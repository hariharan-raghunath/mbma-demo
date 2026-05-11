// ============================================================
// MBMA Music Curriculum
// Topics shown as dropdown options in the FTU form, filtered by grade.
// To add more grades, just add a new entry to the GRADES_CURRICULUM object.
// ============================================================

export interface CurriculumEntry {
  code: string;        // e.g. "1.1"
  topic: string;       // e.g. "What is Sound"
  type: "concept" | "song" | "recap";
}

export const GRADES_CURRICULUM: Record<string, CurriculumEntry[]> = {
  "Class 1": [
    { code: "1.1", topic: "What is Sound", type: "concept" },
    { code: "1.2", topic: "I'm gonna Clap ♬", type: "song" },
    { code: "1.3", topic: "Types of Sound", type: "concept" },
    { code: "1.4", topic: "Bum Bum Bole ♬", type: "song" },
    { code: "1.5", topic: "RECAP", type: "recap" },
    { code: "1.6", topic: "Tones in Voices", type: "concept" },
    { code: "1.7", topic: "Male Banthu Mala ♬", type: "song" },
    { code: "1.8", topic: "Creating Sounds", type: "concept" },
    { code: "1.9", topic: "Desh mere Desh ♬", type: "song" },
    { code: "1.10", topic: "RECAP", type: "recap" },
    { code: "1.11", topic: "Pass the Clap", type: "concept" },
    { code: "1.12", topic: "Jingle Bells Rock ♬", type: "song" },
    { code: "1.13", topic: "Introduction to rhythmic clapping", type: "concept" },
    { code: "1.14", topic: "Frere Jacque ♬", type: "song" },
    { code: "1.15", topic: "RECAP", type: "recap" },
    { code: "1.16", topic: "Beats & Grooves", type: "concept" },
    { code: "1.17", topic: "I'm Just Like You ♬", type: "song" },
    { code: "1.18", topic: "Name the Percussions", type: "concept" },
    { code: "1.19", topic: "Gooma Gooma ke Mara ♬", type: "song" },
    { code: "1.20", topic: "RECAP", type: "recap" },
  ],

  "Class 2": [
    { code: "2.1", topic: "Learning to Listen", type: "concept" },
    { code: "2.2", topic: "We are Marching ♬", type: "song" },
    { code: "2.3", topic: "Music with words", type: "concept" },
    { code: "2.4", topic: "Tup tupa tup ♬", type: "song" },
    { code: "2.5", topic: "RECAP", type: "recap" },
    { code: "2.6", topic: "Listening Adventures", type: "concept" },
    { code: "2.7", topic: "He Sharade ♬", type: "song" },
    { code: "2.8", topic: "Lets Try Beatboxing", type: "concept" },
    { code: "2.9", topic: "Hum honge kamayab ♬", type: "song" },
    { code: "2.10", topic: "RECAP", type: "recap" },
    { code: "2.11", topic: "Fun session with Pitch & drum", type: "concept" },
    { code: "2.12", topic: "Navidad ♬", type: "song" },
    { code: "2.13", topic: "Introduction to Tempo", type: "concept" },
    { code: "2.14", topic: "Siyahamba ♬", type: "song" },
    { code: "2.15", topic: "RECAP", type: "recap" },
    { code: "2.16", topic: "Sounds of nature", type: "concept" },
    { code: "2.17", topic: "Yellow Submarine ♬", type: "song" },
    { code: "2.18", topic: "Sing along / Jam session", type: "concept" },
    { code: "2.19", topic: "Talaash Hai ♬", type: "song" },
    { code: "2.20", topic: "RECAP", type: "recap" },
  ],

  // Add more grades here as needed:
  // "Class 3": [...],
  // "LKG": [...],
};

export const GRADES = Object.keys(GRADES_CURRICULUM);

export const SECTIONS: string[] = ["A", "B", "C", "D", "E"];

// Helper: format a curriculum entry as a single string for display/storage
export function formatTopic(entry: CurriculumEntry): string {
  return `${entry.code} ${entry.topic}`;
}
