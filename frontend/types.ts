
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO string
  dueDate: string; // ISO string for date and time
  notificationMinutes: number | null; // e.g., 0, 5, 15, 30, or null
}

export enum ExpenseCategory {
  Food = 'Food & Drinks',
  Transport = 'Transport',
  Shopping = 'Shopping',
  Entertainment = 'Entertainment',
  Health = 'Health',
  Utilities = 'Utilities',
  Investment = 'Investment',
  JunkFood = 'Junk Food',
  Other = 'Other',
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  createdAt: string; // ISO string
}

export enum IncomeCategory {
    Salary = 'Salary',
    Profit = 'Profit',
    Gift = 'Gift',
    Other = 'Other',
}

export interface Income {
    id: string;
    category: IncomeCategory;
    amount: number;
    description: string;
    createdAt: string; // ISO string
}

export enum Mood {
  Amazing = 'Amazing',
  Good = 'Good',
  Okay = 'Okay',
  Bad = 'Bad',
  Awful = 'Awful',
}

export interface MoodLog {
    id: string;
    mood: Mood;
    createdAt: string; // ISO string
}

export interface Habit {
  id:string;
  name: string;
  description?: string;
  completions: string[]; // Array of ISO date strings
  createdAt: string; // ISO string
}

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface RoutineTask {
  id: string;
  time: string; // "HH:mm" format
  text: string;
}

export type WeeklyRoutine = Record<DayOfWeek, RoutineTask[]>;

export interface JournalEntry {
  id: string;
  text: string;
  createdAt: string; // ISO string for the date of the entry
}

export interface PhotoLog {
  id: string;
  imageDataUrl: string; // base64 encoded image
  note?: string;
  createdAt: string; // ISO string for the date of the entry
}

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string; // ISO string
  milestones: Milestone[];
  createdAt: string;
}

export interface TimeLog {
  id: string;
  activity: string;
  minutes: number;
  createdAt: string; // ISO string
}

export interface Credential {
  id: string;
  website: string;
  username: string;
  password?: string;
  note?: string;
}

// Represents data for a single day
export interface DailyData {
  tasks: Task[];
  expenses: Expense[];
  income: Income[];
  moodLog?: MoodLog; // Only one per day
  journalEntry?: JournalEntry; // Only one per day
  photoLog?: PhotoLog; // Only one per day
  timeLogs: TimeLog[];
}

// The main data structure for the entire application
export interface LifeData {
    // Key is 'YYYY-MM-DD'
    dailyData: Record<string, DailyData>;
    
    // Global items not tied to a specific day
    habits: Habit[];
    weeklyRoutine: WeeklyRoutine;
    goals: Goal[];
    credentials: Credential[]; // Credentials are now stored in plaintext within the encrypted blob.
    vaultSalt?: string;
    vaultCheck?: string;
}
