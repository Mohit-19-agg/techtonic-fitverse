import { supabase } from '@/lib/supabase';
import type { WorkoutSession } from '@/lib/types';

export async function fetchUserSessions(userId: string): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  return data as WorkoutSession[];
}

export function calculateStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;

  const dates = new Set(
    sessions.map((s) => new Date(s.completed_at).toDateString())
  );

  let streak = 0;
  const today = new Date();
  const todayStr = today.toDateString();

  // Check if there's a workout today or yesterday to start the streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (!dates.has(todayStr) && !dates.has(yesterdayStr)) return 0;

  // Start from today or yesterday
  let checkDate = dates.has(todayStr) ? today : yesterday;

  while (dates.has(checkDate.toDateString())) {
    streak++;
    checkDate = new Date(checkDate);
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

export function calculateConsistency(sessions: WorkoutSession[], days: number = 7): number {
  if (sessions.length === 0) return 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recentSessions = sessions.filter((s) => new Date(s.completed_at) >= cutoff);
  const workoutDays = new Set(recentSessions.map((s) => new Date(s.completed_at).toDateString()));

  return Math.round((workoutDays.size / days) * 100);
}

export function getTotalWorkoutTime(sessions: WorkoutSession[]): number {
  return sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
}

export function getTotalReps(sessions: WorkoutSession[]): number {
  return sessions.reduce((sum, s) => sum + (s.reps_completed || 0), 0);
}

export function getUniqueExercises(sessions: WorkoutSession[]): number {
  return new Set(sessions.map((s) => s.exercise_name)).size;
}

export function getAvgFormScore(sessions: WorkoutSession[]): number | null {
  const scored = sessions.filter((s) => s.form_score != null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((sum, s) => sum + (s.form_score || 0), 0) / scored.length);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export async function logWorkoutSession(
  userId: string,
  exerciseName: string,
  workoutType: string,
  reps: number,
  sets: number,
  durationSeconds: number,
  formScore: number | null
): Promise<void> {
  const { error } = await supabase.from('workout_sessions').insert({
    user_id: userId,
    exercise_name: exerciseName,
    workout_type: workoutType,
    reps_completed: reps,
    sets_completed: sets,
    duration_seconds: durationSeconds,
    form_score: formScore,
  });

  if (error) {
    console.error('Error logging workout:', error);
    throw error;
  }
}
