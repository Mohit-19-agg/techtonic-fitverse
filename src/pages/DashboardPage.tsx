import { useEffect, useState } from 'react';
import {
  Flame,
  Clock,
  TrendingUp,
  Dumbbell,
  ChevronRight,
  Activity,
  Target,
  Calendar,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  fetchUserSessions,
  calculateStreak,
  calculateConsistency,
  getTotalWorkoutTime,
  getUniqueExercises,
  getAvgFormScore,
  formatDuration,
} from '@/lib/workout-utils';
import { getRecommendedExercises } from '@/lib/exercises';
import { FITNESS_GOAL_LABELS, FITNESS_LEVEL_LABELS, type Exercise } from '@/lib/types';
import type { Page } from '@/components/AppShell';

export function DashboardPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { profile, user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSessionData[]>([]);
  const [recommended, setRecommended] = useState<Exercise[]>([]);

  type WorkoutSessionData = {
    id: string;
    exercise_name: string;
    workout_type: string;
    reps_completed: number;
    duration_seconds: number;
    form_score: number | null;
    completed_at: string;
  };

  useEffect(() => {
    if (!user) return;
    fetchUserSessions(user.id).then((data) => {
      setSessions(data as WorkoutSessionData[]);
    });
  }, [user]);

  useEffect(() => {
    if (profile) {
      setRecommended(
        getRecommendedExercises(
          profile.fitness_goal,
          profile.fitness_level,
          profile.available_equipment || []
        )
      );
    }
  }, [profile]);

  const streak = calculateStreak(sessions as never);
  const consistency = calculateConsistency(sessions as never);
  const totalTime = getTotalWorkoutTime(sessions as never);
  const uniqueExercises = getUniqueExercises(sessions as never);
  const avgFormScore = getAvgFormScore(sessions as never);
  const completedToday = sessions.filter(
    (s) => new Date(s.completed_at).toDateString() === new Date().toDateString()
  ).length;

  const todaysWorkout = recommended[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/20 via-teal-600/15 to-cyan-600/10 ring-1 ring-inset ring-emerald-500/20 p-6 sm:p-8">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome to FITVERSE, {profile?.full_name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            {profile?.college && `${profile.college}`}
            {profile?.branch && ` • ${profile.branch}`}
            {profile?.year_of_study && ` • ${profile.year_of_study}`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-medium ring-1 ring-inset ring-emerald-500/20">
              <Activity className="w-3.5 h-3.5" />
              {FITNESS_LEVEL_LABELS[profile?.fitness_level || 'beginner'] || 'Beginner'}
            </span>
            {profile?.fitness_goal && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 text-xs font-medium ring-1 ring-inset ring-teal-500/20">
                <Target className="w-3.5 h-3.5" />
                {FITNESS_GOAL_LABELS[profile.fitness_goal] || profile.fitness_goal}
              </span>
            )}
            {streak > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 text-orange-300 text-xs font-medium ring-1 ring-inset ring-orange-500/20">
                <Flame className="w-3.5 h-3.5" />
                {streak} day streak
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${streak} day${streak !== 1 ? 's' : ''}`}
          color="text-orange-400"
          bg="bg-orange-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Workouts Done"
          value={`${sessions.length}`}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Clock}
          label="Total Time"
          value={formatDuration(totalTime)}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Consistency"
          value={`${consistency}%`}
          color="text-teal-400"
          bg="bg-teal-500/10"
        />
      </div>

      {/* Today's workout */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Today's Workout for You</h2>
          <button
            onClick={() => onNavigate('exercises')}
            className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            See all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {todaysWorkout ? (
          <div className="space-y-3">
            <div className="card-elevated p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-inset ring-emerald-500/30">
                <Dumbbell className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{todaysWorkout.name}</h3>
                <p className="text-sm text-slate-400 truncate">{todaysWorkout.description}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {todaysWorkout.duration}s
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {todaysWorkout.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('form-coach')}
                className="btn-primary text-sm px-4 py-2.5 flex-shrink-0"
              >
                Start
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recommended.slice(1, 4).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onNavigate('exercises')}
                  className="card-elevated p-4 text-left hover:ring-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-500 uppercase tracking-wider">{ex.category}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    {ex.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{ex.duration}s</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No workouts recommended yet. Complete your profile to get personalized recommendations.</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          icon={Activity}
          title="AI Form Coach"
          desc="Camera-based pose detection with real-time feedback"
          onClick={() => onNavigate('form-coach')}
          color="from-emerald-500 to-teal-500"
        />
        <QuickAction
          icon={TrendingUp}
          title="My Fitness"
          desc="Track your progress, consistency, and streak"
          onClick={() => onNavigate('my-fitness')}
          color="from-cyan-500 to-blue-500"
        />
        <QuickAction
          icon={Target}
          title="BMI Check"
          desc="Calculate your BMI and get general guidance"
          onClick={() => onNavigate('bmi')}
          color="from-orange-500 to-amber-500"
        />
      </div>

      {/* Recent activity */}
      {sessions.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                  <Dumbbell className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white truncate">{s.exercise_name}</div>
                  <div className="text-xs text-slate-500">
                    {s.reps_completed > 0 && `${s.reps_completed} reps • `}
                    {formatDuration(s.duration_seconds)}
                    {s.form_score != null && ` • Form: ${s.form_score}%`}
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex-shrink-0">
                  {new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedToday === 0 && sessions.length > 0 && (
        <div className="card p-4 flex items-center gap-3 bg-emerald-500/5 ring-emerald-500/20">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 flex-shrink-0">
            <Flame className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-sm text-slate-300">
            You haven't worked out today. Keep your streak going — it only takes 10 minutes!
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
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

function QuickAction({
  icon: Icon,
  title,
  desc,
  onClick,
  color,
}: {
  icon: typeof Flame;
  title: string;
  desc: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="card p-5 text-left group hover:ring-emerald-500/30 transition-all"
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} mb-3 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{title}</h3>
      <p className="text-sm text-slate-400 mt-1">{desc}</p>
    </button>
  );
}
