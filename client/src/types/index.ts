// Auth types
export interface AuthUser {
  id: number;
  username: string;
  name?: string;
  email?: string;
  createdAt: string;
  role?: 'athlete' | 'coach' | 'admin';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  name?: string;
  email?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Workout types
export type WorkoutType = 'AMRAP' | 'EMOM' | 'For Time' | 'Tabata' | 'Strength' | 'Skill' | 'Other';

export interface Workout {
  id: number;
  userId: number;
  date: string;
  type: WorkoutType;
  description: string;
  result?: string;
  completed: boolean;
}

export interface WorkoutFormData {
  date: string;
  type: WorkoutType;
  description: string;
  result?: string;
  completed: boolean;
}

// Exercise types
export type ExerciseCategory = 'Weightlifting' | 'Gymnastics' | 'Cardio' | 'Metcons';

export interface Exercise {
  id: number;
  name: string;
  description: string;
  category: ExerciseCategory;
  videoUrl?: string;
}

// Personal Record types
export interface PersonalRecord {
  id: number;
  userId: number;
  exerciseId: number;
  value: string;
  unit: string;
  date: string;
  notes?: string;
}

export interface PersonalRecordWithExercise extends PersonalRecord {
  exerciseName: string;
}

export interface PRFormData {
  exerciseId: number;
  value: string;
  unit: string;
  date: string;
  notes?: string;
}

// Timer types
export type TimerType = 'Countdown' | 'Stopwatch' | 'EMOM' | 'Tabata' | 'AMRAP';

export interface TimerSettings {
  minutes: number;
  seconds: number;
  rounds?: number;
  workTime?: number;
  restTime?: number;
  enableSound: boolean;
}

// Tab Navigation
export type TabName = 'dashboard' | 'workout' | 'prs' | 'timer' | 'exercises' | 'wod-generator' | 'groups';
