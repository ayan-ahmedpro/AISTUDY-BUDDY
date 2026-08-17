export interface NotebookSource {
  id: string;
  name: string;
  type: 'file' | 'pasted_text' | 'url' | 'youtube' | 'video_ref';
  extractedText: string;
  mimeType?: string;
  base64Data?: string;
  storageRef?: string;
  addedAt: string;
  isActive: boolean;
  enabled?: boolean;
  url?: string;
  notes?: string;
  analysis?: NotebookAnalysis;
}

export interface NotebookNote {
  id: string;
  title: string;
  content: string;
  sourceRefs?: string[];
  createdAt: string;
  pinned: boolean;
  category?: 'chat' | 'flashcard' | 'tutor' | 'faq' | 'user';
}

export interface FAQItem {
  question: string;
  answer: string;
  sourceRefs?: string[];
}

export interface TimelineItem {
  date_or_order: string;
  event: string;
}

export interface StudyGuideSection {
  heading: string;
  bullets: string[];
}

export interface NotebookGuideData {
  briefing: string;
  faq: FAQItem[];
  timeline?: TimelineItem[];
  studyGuide: StudyGuideSection[];
}

export interface MindMapNode {
  id: string;
  label: string;
  category?: string;
  description?: string;
  sourceRefs?: string[];
}

export interface MindMapConnection {
  fromId: string;
  toId: string;
  relation: string;
}

export interface MindMapData {
  topic?: string;
  nodes: MindMapNode[];
  connections: MindMapConnection[];
}

export interface StudyCastLine {
  speaker: 'Host A' | 'Host B';
  line: string;
  conceptTag?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  sourceRef?: string;
}

export interface Flashcard {
  front: string;
  back: string;
  sourceRef?: string;
}

export interface ScheduleItem {
  time: string;
  activity: string;
}

export interface TopicItem {
  title: string;
  explanation: string;
  sourceRef?: string;
}

export interface ChapterItem {
  title: string;
  topics: TopicItem[];
}

export interface NotebookAnalysis {
  subject: string;
  topics: string[];
  summary: string[];
  simpleExplanation: string;
  teacherExplanation: string;
  chapters: ChapterItem[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  weakAreas: {
    difficulty: string;
    suggestion: string;
  };
  schedule: ScheduleItem[];
  mindMap?: MindMapData;
  guide?: NotebookGuideData;
  studyCast?: StudyCastLine[];
}

export interface Notebook {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  age: number;
  sources: NotebookSource[];
  notes: NotebookNote[];
  analysis?: NotebookAnalysis;
  guide?: NotebookGuideData;
  mindMap?: MindMapData;
  studyCastScript?: StudyCastLine[];
}
