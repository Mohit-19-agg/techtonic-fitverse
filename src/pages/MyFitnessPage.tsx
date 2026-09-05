import { useEffect, useState } from 'react';
import {
  Flame,
  Clock,
  TrendingUp,
  Dumbbell,
  Activity,
  Target,
  Award,
  Calendar,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  fetchUserSessions,
  calculateStreak,
  calculateConsistency,
  getTotalWorkoutTime,
  getTotalReps,
  getUniqueExercises,
  getAvgFormScore,
  formatDuration,
} from '@/lib/workout-utils';
import { calculateBMI } from '@/lib/bmi';
import { FITNESS_GOAL_LABELS, FITNESS_LEVEL_LABELS, type WorkoutSession } from '@/lib/types';

export function MyFitnessPage() {
  const { profile, user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchUserSessions(user.id).then(setSessions);
  }, [user]);

  const streak = calculateStreak(sessions);
  const consistency = calculateConsistency(sessions);
  const totalTime = getTotalWorkoutTime(sessions);
  const totalReps = getTotalReps(sessions);
  const uniqueExercises = getUniqueExercises(sessions);
  const avgFormScore = getAvgFormScore(sessions);
  const bmiResult = calculateBMI(Number(profile?.height_cm) || 0, Number(profile?.weight_kg) || 0);

  // Weekly data for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const dailyData = last7Days.map((d) => {
    const daySessions = sessions.filter(
      (s) => new Date(s.completed_at).toDateString() === d.toDateString()
    );
    return {
      date: d,
      workouts: daySessions.length,
      time: daySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0),
    };
  });

  const maxWorkouts = Math.max(...dailyData.map((d) => d.workouts), 1);

  // Exercise frequency
  const exerciseFreq = sessions.reduce((acc, s) => {
    acc[s.exercise_name] = (acc[s.exercise_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topExercises = Object.entries(exerciseFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">My Fitness</h1>
        <p className="text-slate-400 mt-1 text-sm">Your personal progress and healthy habits</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FitnessStat
          icon={Flame}
          label="Current Streak"
          value={`${streak} day${streak !== 1 ? 's' : ''}`}
          color="text-orange-400"
          bg="bg-orange-500/10"
        />
        <FitnessStat
          icon={Calendar}
          label="Workouts Completed"
          value={`${sessions.length}`}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <FitnessStat
          icon={Clock}
          label="Total Workout Time"
          value={formatDuration(totalTime)}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
        />
        <FitnessStat
          icon={TrendingUp}
          label="Consistency (7d)"
          value={`${consistency}%`}
          color="text-teal-400"
          bg="bg-teal-500/10"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FitnessStat
          icon={Zap}
          label="Total Reps"
          value={`${totalReps}`}
          color="text-yellow-400"
          bg="bg-yellow-500/10"
        />
        <FitnessStat
          icon={Dumbbell}
          label="Exercises Practiced"
          value={`${uniqueExercises}`}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <FitnessStat
          icon={Activity}
          label="Avg Form Score"
          value={avgFormScore != null ? `${avgFormScore}%` : '—'}
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
        <FitnessStat
          icon={Target}
          label="Fitness Level"
          value={FITNESS_LEVEL_LABELS[profile?.fitness_level || 'beginner'] || 'Beginner'}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
      </div>

      {/* Weekly activity chart */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-white mb-4">Weekly Activity</h2>
        <div className="flex items-end justify-between gap-2 h-40">
          {dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end h-28">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300 group relative"
                  style={{ height: `${(d.workouts / maxWorkouts) * 100}%`, minHeight: d.workouts > 0 ? '8px' : '2px' }}
                >
                  {d.workouts > 0 && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.workouts}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {d.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitness goals */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Fitness Profile</h2>
          <div className="space-y-3">
            <ProfileRow icon={Activity} label="Fitness Level" value={FITNESS_LEVEL_LABELS[profile?.fitness_level || 'beginner'] || 'Beginner'} />
            <ProfileRow icon={Target} label="Fitness Goal" value={profile?.fitness_goal ? FITNESS_GOAL_LABELS[profile.fitness_goal] || profile.fitness_goal : 'Not set'} />
            <ProfileRow icon={Clock} label="Preferred Duration" value={profile?.preferred_workout_duration || 'Not set'} />
            <ProfileRow icon={Calendar} label="Preferred Days" value={profile?.preferred_workout_days || 'Not set'} />
          </div>
        </div>

        {/* BMI (if available) */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Health Snapshot</h2>
          {bmiResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 ring-1 ring-inset ring-slate-800">
                <div>
                  <div className="text-sm text-slate-400">Your BMI</div>
                  <div className={`text-3xl font-bold ${bmiResult.color}`}>{bmiResult.value}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${bmiResult.color}`}>{bmiResult.category}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {profile?.height_cm}cm • {profile?.weight_kg}kg
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Your BMI is a general screening measure, not a diagnosis.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Add your height and weight to see your BMI</p>
            </div>
          )}
        </div>
      </div>

      {/* Top exercises */}
      {topExercises.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Most Practiced Exercises</h2>
          <div className="space-y-3">
            {topExercises.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-500/20 text-amber-400' :
                  i === 1 ? 'bg-slate-400/20 text-slate-300' :
                  i === 2 ? 'bg-orange-700/20 text-orange-500' :
                  'bg-slate-800 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-white">{name}</div>
                  <div className="h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${(count / topExercises[0][1]) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-400 tabular-nums">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form improvement */}
      {avgFormScore != null && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Form Improvement</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400">{avgFormScore}%</div>
              <div className="text-xs text-slate-500 mt-1">Average Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {sessions.filter((s) => s.form_score != null && s.form_score >= 80).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Good Form Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {sessions.filter((s) => s.form_score != null).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">AI-Coached Sessions</div>
            </div>
          </div>
          {avgFormScore >= 80 && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Great form consistency! You're maintaining proper technique across workouts.
            </div>
          )}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="card p-8 text-center">
          <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-300">No workouts yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Start your first workout with the AI Form Coach to begin tracking your progress!
          </p>
        </div>
      )}
    </div>
  );
}

function FitnessStat({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="card p-5">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label mt-1">{label}</div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  );
}
