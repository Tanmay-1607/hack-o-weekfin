export interface Course {
  id: string;
  name: string;
  code?: string;
  instructor?: string;
  location?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string or human readable
  time?: string;
  courseId?: string;
  type: 'lecture' | 'exam' | 'assignment' | 'other';
  description?: string;
}

export interface ExtractionResult {
  courses: Course[];
  events: CalendarEvent[];
  summary: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
