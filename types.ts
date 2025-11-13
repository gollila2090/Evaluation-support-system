
export interface AssessmentPlan {
  subject: string;
  domain: string;
  period: string;
  assessmentElements: string;
  assessmentMethod: string;
  achievementStandard: string;
  keyPoints: string;
  criteria: {
    high: string;
    medium: string;
    low: string;
  };
}

export interface AssessmentCriteria {
  unit: string;
  assessmentArea: string;
  assessmentPeriod: string;
  assessmentMethod: string;
  achievementStandard: string;
  subjectCompetencies: string[];
  assessmentElements: string;
}

export interface RubricLevel {
  level: '상' | '중' | '하';
  score: string;
  descriptions: string[]; // Descriptions for each criterion
}

export interface Rubric {
  criteria: string[]; // The names of the criteria (table headers)
  levels: RubricLevel[];
}

export interface ScoringSummary {
    high: string; // e.g., "총점 5-6점"
    medium: string; // e.g., "총점 3-4점"
    low: string; // e.g., "총점 2점 이하"
}

export interface ExampleAnswer {
  question: string; // 문항 번호 또는 요약 (예: '1번 문항')
  answer: string;   // 해당 문항에 대한 모범 답안
}

export interface GeneratedData {
  criteria: AssessmentCriteria;
  rubric: Rubric;
  scoringSummary: ScoringSummary;
  exampleAnswers: ExampleAnswer[];
}

export interface ReferenceItem {
  id: number;
  type: 'file' | 'link';
  title: string;
  url: string; // data URL for file, http/https for link
}