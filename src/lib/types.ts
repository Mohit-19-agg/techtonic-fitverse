export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type FitnessGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'endurance'
  | 'flexibility'
  | 'general_fitness'
  | 'stress_relief';

export type WorkoutCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'hiit'
  | 'core'
  | 'yoga';

export interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  college: string | null;
  branch: string | null;
  year_of_study: string | null;
  semester: string | null;
  age: number | null;
  gender: string | null;
  fitness_level: FitnessLevel | string;
  fitness_goal: FitnessGoal | string | null;
  preferred_workout_duration: string | null;
  preferred_workout_days: string | null;
  available_equipment: string[];
  preferred_feedback_language: string;
  height_cm: number | null;
  weight_kg: number | null;
  opted_into_community: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_type: string;
  exercise_name: string;
  reps_completed: number;
  sets_completed: number;
  duration_seconds: number;
  form_score: number | null;
  completed_at: string;
  created_at: string;
}

export interface CollegeCommunityStats {
  college: string;
  participating_students: number;
  total_workouts: number;
  total_workout_seconds: number;
  total_reps: number;
}

export interface CollegeLeaderboardEntry {
  college: string;
  username: string;
  full_name: string;
  fitness_level: string;
  completed_sessions: number;
  total_seconds: number;
  last_workout: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: WorkoutCategory;
  difficulty: FitnessLevel;
  description: string;
  instructions: string[];
  duration: number;
  equipment: string;
  targetMuscles: string[];
  icon: string;
}

export const BRANCH_OPTIONS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Electronics & Electrical Engineering (EEE)',
  'Electronics & Instrumentation Engineering',
  'Electronics & Telecommunication Engineering',
  'Aerospace Engineering',
  'Automobile Engineering',
  'Biotechnology',
  'Biomedical Engineering',
  'Chemical Engineering',
  'Metallurgical Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Agricultural Engineering',
  'Industrial Engineering',
  'Production Engineering',
  'Marine Engineering',
  'Naval Architecture',
  'Textile Engineering',
  'Food Technology',
  'Pharmaceutical Engineering',
  'Environmental Engineering',
  'Structural Engineering',
  'Architecture',
  'Computer Applications (MCA/BCA)',
  'Business Administration (MBA/BBA)',
  'Other',
] as const;

export const EQUIPMENT_OPTIONS = [
  'No Equipment (Bodyweight)',
  'Dumbbells',
  'Resistance Bands',
  'Yoga Mat',
  'Kettlebell',
  'Pull-up Bar',
  'Gym Access',
] as const;

export const FITNESS_GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  endurance: 'Endurance',
  flexibility: 'Flexibility',
  general_fitness: 'General Fitness',
  stress_relief: 'Stress Relief',
};

export const FITNESS_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
